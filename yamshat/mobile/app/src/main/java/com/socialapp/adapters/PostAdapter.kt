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
import com.socialapp.models.Post

class PostAdapter(
    private val onLike: (Post) -> Unit
) : ListAdapter<Post, PostAdapter.VH>(PostDiff()) {

    class VH(val binding: ItemPostBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemPostBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val item = getItem(position)
        
        // Prevent unnecessary text updates if they haven't changed
        if (holder.binding.username.text != item.username) {
            holder.binding.username.text = item.username
        }
        if (holder.binding.content.text != item.content) {
            holder.binding.content.text = item.content
        }

        val media = item.media.orEmpty()
        if (media.isNotBlank()) {
            holder.binding.mediaPreview.visibility = View.VISIBLE
            Glide.with(holder.itemView.context)
                .load(media)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .placeholder(android.R.drawable.progress_indeterminate_horizontal)
                .error(android.R.drawable.stat_notify_error)
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
