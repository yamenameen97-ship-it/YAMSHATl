package com.socialapp.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.view.isVisible
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.recyclerview.widget.RecyclerView
import com.socialapp.databinding.ItemReelBinding
import com.socialapp.models.Reel
import com.socialapp.utils.ReelPlaybackManager
import kotlin.math.abs

class ReelsAdapter(private val list: List<Reel>) : RecyclerView.Adapter<ReelsAdapter.VH>() {

    private val holders = mutableMapOf<Int, VH>()
    private var activePosition = 0

    init {
        setHasStableIds(true)
    }

    class VH(val binding: ItemReelBinding) : RecyclerView.ViewHolder(binding.root) {
        var boundPosition: Int = RecyclerView.NO_POSITION
        var player: ExoPlayer? = null
        var listener: Player.Listener? = null

        fun release() {
            binding.playerView.player = null
            listener?.let { activeListener -> player?.removeListener(activeListener) }
            player?.release()
            player = null
            listener = null
            boundPosition = RecyclerView.NO_POSITION
            binding.bufferingIndicator.isVisible = false
            binding.errorText.isVisible = false
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemReelBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        holders[position] = holder
        val item = list[position]
        holder.binding.username.text = item.username
        holder.binding.errorText.isVisible = false
        holder.binding.bufferingIndicator.isVisible = true

        if (holder.boundPosition != RecyclerView.NO_POSITION && holder.boundPosition != position) {
            holders.remove(holder.boundPosition)
        }

        if (holder.boundPosition != position) {
            holder.release()
            holder.boundPosition = position
        }

        if (holder.player == null) {
            val player = ReelPlaybackManager.buildPlayer(holder.itemView.context)
            val listener = object : Player.Listener {
                override fun onPlaybackStateChanged(playbackState: Int) {
                    if (holder.boundPosition != position) return
                    holder.binding.bufferingIndicator.isVisible = playbackState == Player.STATE_BUFFERING
                    if (playbackState == Player.STATE_READY && activePosition == position) {
                        player.playWhenReady = true
                        player.volume = 1f
                    }
                }

                override fun onPlayerError(error: PlaybackException) {
                    if (holder.boundPosition != position) return
                    holder.binding.bufferingIndicator.isVisible = false
                    holder.binding.errorText.isVisible = true
                    holder.binding.errorText.text = "الاتصال بطّأ التحميل.. بنحاول تاني"
                    player.prepare()
                    if (activePosition == position) {
                        player.playWhenReady = true
                    }
                }
            }

            player.addListener(listener)
            player.setMediaItem(ReelPlaybackManager.mediaItem(item.video_url))
            player.prepare()
            player.playWhenReady = position == activePosition
            player.volume = if (position == activePosition) 1f else 0f

            holder.player = player
            holder.listener = listener
            holder.binding.playerView.player = player
        } else {
            holder.binding.playerView.player = holder.player
            holder.player?.playWhenReady = position == activePosition
            holder.player?.volume = if (position == activePosition) 1f else 0f
        }

        preloadAround(position, holder)
    }

    override fun onViewAttachedToWindow(holder: VH) {
        super.onViewAttachedToWindow(holder)
        if (holder.boundPosition == activePosition) {
            holder.player?.playWhenReady = true
            holder.player?.volume = 1f
        }
    }

    override fun onViewDetachedFromWindow(holder: VH) {
        holder.player?.playWhenReady = false
        holder.player?.volume = 0f
        super.onViewDetachedFromWindow(holder)
    }

    override fun onViewRecycled(holder: VH) {
        super.onViewRecycled(holder)
        holder.release()
        holders.entries.removeAll { it.value == holder }
    }

    override fun getItemCount() = list.size

    override fun getItemId(position: Int): Long = list[position].id.toLong()

    fun playVideo(position: Int) {
        activePosition = position
        holders.forEach { (index, holder) ->
            val shouldPlay = index == position
            holder.player?.playWhenReady = shouldPlay
            holder.player?.volume = if (shouldPlay) 1f else 0f
            if (!shouldPlay) holder.player?.pause()
        }
        holders[position]?.let { preloadAround(position, it) }
        pruneOutsideWindow(position)
    }

    fun pauseAll() {
        holders.values.forEach { holder ->
            holder.player?.playWhenReady = false
            holder.player?.pause()
        }
    }

    fun resumeActive() {
        if (activePosition != RecyclerView.NO_POSITION) {
            playVideo(activePosition)
        }
    }

    fun releaseAll() {
        holders.values.forEach { it.release() }
        holders.clear()
        ReelPlaybackManager.cancelPreloads()
    }

    private fun preloadAround(position: Int, holder: VH) {
        val context = holder.itemView.context.applicationContext
        for (offset in 1..2) {
            list.getOrNull(position + offset)?.video_url?.let { ReelPlaybackManager.preload(context, it) }
        }
    }

    private fun pruneOutsideWindow(centerPosition: Int) {
        val entriesToRemove = holders.entries.filter { abs(it.key - centerPosition) > 1 }
        entriesToRemove.forEach { entry ->
            entry.value.release()
            holders.remove(entry.key)
        }
    }
}
