package com.socialapp.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.socialapp.databinding.ItemStoryBinding
import com.socialapp.models.Story

class StoriesAdapter(private val list: List<Story>) : RecyclerView.Adapter<StoriesAdapter.VH>() {

    class VH(val binding: ItemStoryBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemStoryBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val item = list[position]
        holder.binding.storyName.text = item.username
        if (!item.avatarUrl.isNullOrBlank()) {
            Glide.with(holder.itemView.context)
                .load(item.avatarUrl)
                .diskCacheStrategy(DiskCacheStrategy.NONE)
                .into(holder.binding.storyAvatar)
        }
    }

    override fun getItemCount() = list.size
}
