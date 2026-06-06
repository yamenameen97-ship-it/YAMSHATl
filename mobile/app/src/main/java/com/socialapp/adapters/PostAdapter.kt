package com.socialapp.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.Animation
import android.view.animation.AnimationUtils
import android.view.animation.ScaleAnimation
import android.widget.ImageButton
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.socialapp.databinding.ItemPostBinding
import com.socialapp.databinding.ItemLivePostBinding
import com.socialapp.models.Post

class PostAdapter(
    private val onLike: (Post) -> Unit,
    private val onWatchLive: (Post) -> Unit = {}
) : ListAdapter<Post, RecyclerView.ViewHolder>(PostDiff()) {

    companion object {
        private const val TYPE_REGULAR_POST = 0
        private const val TYPE_LIVE_POST = 1
    }

    // Regular Post ViewHolder
    class RegularPostVH(val binding: ItemPostBinding) : RecyclerView.ViewHolder(binding.root)

    // Live Post ViewHolder
    class LivePostVH(val binding: ItemLivePostBinding) : RecyclerView.ViewHolder(binding.root)

    override fun getItemViewType(position: Int): Int {
        val post = getItem(position)
        return if (post.hasLiveStream && post.liveStream != null) {
            TYPE_LIVE_POST
        } else {
            TYPE_REGULAR_POST
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return when (viewType) {
            TYPE_LIVE_POST -> {
                val binding = ItemLivePostBinding.inflate(LayoutInflater.from(parent.context), parent, false)
                LivePostVH(binding)
            }
            else -> {
                val binding = ItemPostBinding.inflate(LayoutInflater.from(parent.context), parent, false)
                RegularPostVH(binding)
            }
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val item = getItem(position)

        when (holder) {
            is LivePostVH -> bindLivePost(holder, item)
            is RegularPostVH -> bindRegularPost(holder, item)
        }
    }

    private fun bindRegularPost(holder: RegularPostVH, item: Post) {
        holder.binding.username.text = item.username
        holder.binding.content.text = item.content

        val media = item.media.orEmpty()
        if (media.isNotBlank()) {
            holder.binding.mediaPreview.visibility = View.VISIBLE
            Glide.with(holder.itemView.context)
                .load(media)
                .diskCacheStrategy(DiskCacheStrategy.NONE)
                .centerCrop()
                .into(holder.binding.mediaPreview)
        } else {
            holder.binding.mediaPreview.visibility = View.GONE
        }

        val anim = AnimationUtils.loadAnimation(holder.itemView.context, android.R.anim.fade_in)
        holder.itemView.startAnimation(anim)

        holder.binding.likeButton.setOnClickListener {
            animateLike(it as ImageButton)
            onLike(item)
        }
    }

    private fun bindLivePost(holder: LivePostVH, item: Post) {
        // Set username
        holder.binding.username.text = item.username

        // Set stream title
        val streamTitle = item.liveStream?.title ?: "بث مباشر جديد"
        holder.binding.streamTitle.text = streamTitle

        // Set stream description (using content if available)
        val streamDescription = item.content.ifBlank { "انضم الآن لمشاهدة البث المباشر" }
        holder.binding.streamDescription.text = streamDescription

        // Set viewer count
        val viewerCount = item.liveStream?.viewerCount ?: 0
        holder.binding.viewerCount.text = formatViewerCount(viewerCount)

        // Load thumbnail
        val thumbnail = item.media ?: item.imageUrl
        if (!thumbnail.isNullOrBlank()) {
            Glide.with(holder.itemView.context)
                .load(thumbnail)
                .diskCacheStrategy(DiskCacheStrategy.NONE)
                .centerCrop()
                .into(holder.binding.liveStreamThumbnail)
        }

        // Add animation
        val anim = AnimationUtils.loadAnimation(holder.itemView.context, android.R.anim.fade_in)
        holder.itemView.startAnimation(anim)

        // Like button
        holder.binding.likeButton.setOnClickListener {
            animateLike(it as ImageButton)
            onLike(item)
        }

        // Play button - opens live stream
        holder.binding.playButton.setOnClickListener {
            onWatchLive(item)
        }

        // Watch live button
        holder.binding.watchLiveButton.setOnClickListener {
            onWatchLive(item)
        }

        // Thumbnail click - opens live stream
        holder.binding.liveStreamThumbnail.setOnClickListener {
            onWatchLive(item)
        }
    }

    private fun formatViewerCount(count: Int): String {
        return when {
            count >= 1_000_000 -> "${count / 1_000_000}M"
            count >= 1_000 -> "${count / 1_000}K"
            else -> count.toString()
        }
    }

    private fun animateLike(view: ImageButton) {
        val scale = ScaleAnimation(
            0.95f, 1f, 0.95f, 1f,
            Animation.RELATIVE_TO_SELF, 0.5f,
            Animation.RELATIVE_TO_SELF, 0.5f
        )
        scale.duration = 150
        view.startAnimation(scale)
    }
}

class PostDiff : DiffUtil.ItemCallback<Post>() {
    override fun areItemsTheSame(old: Post, new: Post) = old.id == new.id
    override fun areContentsTheSame(old: Post, new: Post) = old == new
}
