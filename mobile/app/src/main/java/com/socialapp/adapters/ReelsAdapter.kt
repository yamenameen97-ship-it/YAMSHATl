package com.socialapp.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.VideoView
import androidx.recyclerview.widget.RecyclerView
import com.socialapp.databinding.ItemReelBinding
import com.socialapp.models.Reel

class ReelsAdapter(private val list: List<Reel>) : RecyclerView.Adapter<ReelsAdapter.VH>() {

    private val holders = mutableMapOf<Int, VH>()

    init {
        setHasStableIds(true)
    }

    class VH(val binding: ItemReelBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemReelBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        holders[position] = holder
        val item = list[position]
        holder.binding.username.text = item.username
        holder.binding.videoView.setVideoPath(item.video_url)
        holder.binding.videoView.setOnPreparedListener {
            it.isLooping = true
            if (position == 0) holder.binding.videoView.start() else holder.binding.videoView.pause()
        }
    }

    override fun onViewAttachedToWindow(holder: VH) {
        super.onViewAttachedToWindow(holder)
        if (holder.bindingAdapterPosition == 0) {
            safeStart(holder.binding.videoView)
        }
    }

    override fun onViewDetachedFromWindow(holder: VH) {
        holder.binding.videoView.pause()
        super.onViewDetachedFromWindow(holder)
    }

    override fun onViewRecycled(holder: VH) {
        super.onViewRecycled(holder)
        holder.binding.videoView.stopPlayback()
        holders.entries.removeAll { it.value == holder }
    }

    override fun getItemCount() = list.size

    override fun getItemId(position: Int): Long = list[position].id.toLong()

    fun playVideo(position: Int) {
        holders.forEach { (index, holder) ->
            if (index == position) {
                safeStart(holder.binding.videoView)
            } else {
                holder.binding.videoView.pause()
            }
        }
    }

    private fun safeStart(videoView: VideoView) {
        videoView.setOnPreparedListener {
            it.isLooping = true
            videoView.start()
        }
        if (!videoView.isPlaying) videoView.start()
    }
}
