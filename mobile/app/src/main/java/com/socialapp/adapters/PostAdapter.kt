package com.socialapp.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.socialapp.databinding.ItemPostBinding
import com.socialapp.models.Post
import com.socialapp.utils.UiKit

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

        UiKit.animateListItem(holder.itemView)

        holder.binding.likeButton.setOnClickListener {
            animateLike(it as ImageButton)
            onLike(item)
        }
    }

    private fun animateLike(view: ImageButton) {
        view.animate()
            .scaleX(1.12f)
            .scaleY(1.12f)
            .setDuration(110)
            .withEndAction {
                view.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(110)
                    .start()
            }
            .start()
    }
}

class PostDiff : DiffUtil.ItemCallback<Post>() {
    override fun areItemsTheSame(old: Post, new: Post) = old.id == new.id
    override fun areContentsTheSame(old: Post, new: Post) = old == new
}
