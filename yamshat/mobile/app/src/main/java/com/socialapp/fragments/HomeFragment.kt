package com.socialapp.fragments

import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.socialapp.adapters.PostAdapter
import com.socialapp.adapters.StoriesAdapter
import com.socialapp.databinding.FragmentHomeBinding
import com.socialapp.models.Post
import com.socialapp.models.Story
import com.socialapp.moderation.AiModerationEngine
import com.socialapp.network.ApiClient
import com.socialapp.network.SessionManager
import com.socialapp.local.AppDatabase
import com.socialapp.repositories.StoriesRepository
import com.socialapp.local.PostEntity
import com.socialapp.utils.AppAnalytics
import com.socialapp.utils.SecureMediaManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.io.File
import java.io.FileOutputStream

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!
    private var uploadedMediaUrl: String? = null
    private val cache = mutableListOf<Post>()
    private lateinit var postAdapter: PostAdapter
    private var currentPage = 1
    private var isLoading = false
    private var isLastPage = false
    private val storiesRepository = StoriesRepository()
    private val moderationEngine = AiModerationEngine()

    private val picker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let {
            binding.imagePreview.visibility = View.VISIBLE
            Glide.with(this).load(it).diskCacheStrategy(DiskCacheStrategy.NONE).into(binding.imagePreview)
            uploadFile(it)
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        loadOfflinePosts()

        postAdapter = PostAdapter { post ->
            if (post.username != SessionManager.getUsername()) {
                ApiClient.api.like(mapOf("to_user" to post.username, "post_id" to post.id.toString()))
                    .enqueue(simpleCallback())
                ApiClient.api.track(mapOf("event" to "like_post"))
                    .enqueue(simpleCallback())
                AppAnalytics.trackLike(post.id.toString())
            }
        }

        val layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerPosts.layoutManager = layoutManager
        binding.recyclerPosts.setHasFixedSize(true)
        binding.recyclerPosts.setItemViewCacheSize(20)
        binding.recyclerPosts.adapter = postAdapter

        binding.recyclerPosts.addOnScrollListener(object : androidx.recyclerview.widget.RecyclerView.OnScrollListener() {
            override fun onScrolled(recyclerView: androidx.recyclerview.widget.RecyclerView, dx: Int, dy: Int) {
                super.onScrolled(recyclerView, dx, dy)
                val visibleItemCount = layoutManager.childCount
                val totalItemCount = layoutManager.itemCount
                val firstVisibleItemPosition = layoutManager.findFirstVisibleItemPosition()

                if (!isLoading && !isLastPage) {
                    if ((visibleItemCount + firstVisibleItemPosition) >= totalItemCount
                        && firstVisibleItemPosition >= 0
                        && totalItemCount >= 10) {
                        loadPosts(isNextPage = true)
                    }
                }
            }
        })

        binding.storiesRecycler.layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
        storiesRepository.loadStories { stories ->
            if (!isAdded) return@loadStories
            binding.storiesRecycler.adapter = StoriesAdapter(stories)
        }

        binding.selectMedia.setOnClickListener {
            picker.launch("*/*")
        }

        binding.postBtn.setOnClickListener {
            val text = binding.postText.text.toString().trim()
            if (text.isBlank() && uploadedMediaUrl.isNullOrBlank()) {
                Toast.makeText(requireContext(), "اكتب منشور أو اختر ملف أولاً", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val moderationDecision = moderationEngine.evaluatePost(text, uploadedMediaUrl)
            if (moderationDecision.isBlocked) {
                Toast.makeText(requireContext(), moderationDecision.reason, Toast.LENGTH_LONG).show()
                AppAnalytics.trackEvent("post_blocked_by_moderation", mapOf("severity" to moderationDecision.severity))
                return@setOnClickListener
            }
            val sanitizedText = moderationDecision.sanitizedText.ifBlank { text }

            ApiClient.api.createPost(mapOf("content" to sanitizedText, "media" to uploadedMediaUrl))
                .enqueue(object : Callback<com.socialapp.models.ApiMessage> {
                    override fun onResponse(
                        call: Call<com.socialapp.models.ApiMessage>,
                        response: Response<com.socialapp.models.ApiMessage>
                    ) {
                        binding.postText.setText("")
                        uploadedMediaUrl = null
                        binding.imagePreview.visibility = View.GONE
                        ApiClient.api.track(mapOf("event" to "create_post")).enqueue(simpleCallback())
                        loadPosts()
                    }

                    override fun onFailure(call: Call<com.socialapp.models.ApiMessage>, t: Throwable) {
                        Toast.makeText(requireContext(), t.message ?: "Post failed", Toast.LENGTH_SHORT).show()
                    }
                })
        }

        loadPosts()
    }

    override fun onResume() {
        super.onResume()
        AppAnalytics.trackScreen("home")
    }

    private fun loadOfflinePosts() {
        CoroutineScope(Dispatchers.IO).launch {
            val offlinePosts = AppDatabase.getDatabase(requireContext()).postDao().getAllPosts()
            val posts = offlinePosts.map { Post(it.id, it.username, it.content, it.media, it.created_at) }
            withContext(Dispatchers.Main) {
                if (posts.isNotEmpty() && cache.isEmpty()) {
                    cache.addAll(posts)
                    postAdapter.submitList(cache.toList())
                }
            }
        }
    }

    private fun loadPosts(isNextPage: Boolean = false) {
        if (isLoading) return
        isLoading = true
        
        if (!isNextPage) {
            currentPage = 1
            isLastPage = false
        } else {
            currentPage++
        }

        ApiClient.api.getPosts(page = currentPage)
            .enqueue(object : Callback<List<Post>> {
                override fun onResponse(call: Call<List<Post>>, response: Response<List<Post>>) {
                    isLoading = false
                    val posts = response.body().orEmpty()
                    
                    if (posts.isEmpty()) {
                        isLastPage = true
                    } else {
                        if (!isNextPage) {
                            cache.clear()
                            savePostsToOffline(posts)
                        }
                        cache.addAll(posts)
                        postAdapter.submitList(cache.toList())
                    }
                }

                override fun onFailure(call: Call<List<Post>>, t: Throwable) {
                    isLoading = false
                    Toast.makeText(requireContext(), t.message ?: "Load failed", Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun savePostsToOffline(posts: List<Post>) {
        CoroutineScope(Dispatchers.IO).launch {
            val entities = posts.map { PostEntity(it.id, it.username, it.content, it.media, it.created_at) }
            val db = AppDatabase.getDatabase(requireContext())
            db.postDao().deleteAll()
            db.postDao().insertPosts(entities)
        }
    }

    private fun uploadFile(uri: Uri) {
        val file = createTempFileFromUri(requireContext(), uri) ?: return
        val requestFile = file.asRequestBody("multipart/form-data".toMediaTypeOrNull())
        val body = MultipartBody.Part.createFormData("file", file.name, requestFile)

        ApiClient.api.uploadFile(body)
            .enqueue(object : Callback<Map<String, String>> {
                override fun onResponse(
                    call: Call<Map<String, String>>,
                    response: Response<Map<String, String>>
                ) {
                    uploadedMediaUrl = response.body()?.get("url") ?: response.body()?.get("file_url")
                    Toast.makeText(requireContext(), "تم رفع الملف", Toast.LENGTH_SHORT).show()
                }

                override fun onFailure(call: Call<Map<String, String>>, t: Throwable) {
                    Toast.makeText(requireContext(), t.message ?: "Upload failed", Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun createTempFileFromUri(context: Context, uri: Uri): File? {
        return try {
            val input = context.contentResolver.openInputStream(uri) ?: return null
            val file = SecureMediaManager.createSecureTempFile(context, "upload_", ".tmp")
            FileOutputStream(file).use { output ->
                input.copyTo(output)
            }
            input.close()
            file
        } catch (e: Exception) {
            Toast.makeText(context, e.message ?: "File error", Toast.LENGTH_SHORT).show()
            null
        }
    }

    private fun simpleCallback() = object : Callback<com.socialapp.models.ApiMessage> {
        override fun onResponse(
            call: Call<com.socialapp.models.ApiMessage>,
            response: Response<com.socialapp.models.ApiMessage>
        ) = Unit

        override fun onFailure(call: Call<com.socialapp.models.ApiMessage>, t: Throwable) = Unit
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
