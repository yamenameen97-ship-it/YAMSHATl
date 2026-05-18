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
import com.socialapp.network.ApiClient
import com.socialapp.network.SessionManager
import com.socialapp.utils.AppAnalytics
import com.socialapp.utils.SecureMediaManager
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

        postAdapter = PostAdapter { post ->
            if (post.username != SessionManager.getUsername()) {
                ApiClient.api.like(mapOf("to_user" to post.username, "post_id" to post.id.toString()))
                    .enqueue(simpleCallback())
                ApiClient.api.track(mapOf("event" to "like_post"))
                    .enqueue(simpleCallback())
                AppAnalytics.trackLike(post.id.toString())
            }
        }

        binding.recyclerPosts.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerPosts.setHasFixedSize(true)
        binding.recyclerPosts.setItemViewCacheSize(20)
        binding.recyclerPosts.adapter = postAdapter

        binding.storiesRecycler.layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
        binding.storiesRecycler.adapter = StoriesAdapter(
            listOf(
                Story(SessionManager.getUsername().ifBlank { "You" }),
                Story("Sara"),
                Story("Omar"),
                Story("Noor")
            )
        )

        binding.selectMedia.setOnClickListener {
            picker.launch("*/*")
        }

        binding.postBtn.setOnClickListener {
            val text = binding.postText.text.toString().trim()
            if (text.isBlank() && uploadedMediaUrl.isNullOrBlank()) {
                Toast.makeText(requireContext(), "اكتب منشور أو اختر ملف أولاً", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            ApiClient.api.createPost(mapOf("content" to text, "media" to uploadedMediaUrl))
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

    private fun loadPosts() {
        ApiClient.api.getPosts()
            .enqueue(object : Callback<List<Post>> {
                override fun onResponse(call: Call<List<Post>>, response: Response<List<Post>>) {
                    cache.clear()
                    cache.addAll(response.body().orEmpty())
                    postAdapter.submitList(cache.toList())
                }

                override fun onFailure(call: Call<List<Post>>, t: Throwable) {
                    Toast.makeText(requireContext(), t.message ?: "Load failed", Toast.LENGTH_SHORT).show()
                }
            })
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
