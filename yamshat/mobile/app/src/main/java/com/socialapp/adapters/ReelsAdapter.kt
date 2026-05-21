package com.socialapp.adapters

import android.net.Uri
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector
import androidx.recyclerview.widget.RecyclerView
import com.socialapp.databinding.ItemReelBinding
import com.socialapp.models.Reel
import com.socialapp.player.VideoCacheManager
import com.socialapp.player.VideoDeliveryManager
import com.socialapp.player.VideoPreloadManager

@UnstableApi
class ReelsAdapter(
    private val list: MutableList<Reel>,
    private val onFocused: (Reel) -> Unit,
) : RecyclerView.Adapter<ReelsAdapter.VH>() {

    private val holders = mutableMapOf<Int, VH>()
    private var preloadManager: VideoPreloadManager? = null

    init {
        setHasStableIds(true)
    }

    class VH(val binding: ItemReelBinding, var player: ExoPlayer? = null) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        if (preloadManager == null) {
            preloadManager = VideoPreloadManager(parent.context.applicationContext)
        }
        val binding = ItemReelBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        holders[position] = holder
        val item = list[position]
        val context = holder.itemView.context
        holder.binding.username.text = item.username
        holder.binding.captionText.text = item.caption?.ifBlank { "استمتع بتشغيل متكيّف وتجربة سحب أخف" }
            ?: "استمتع بتشغيل متكيّف وتجربة سحب أخف"
        holder.binding.likesCount.text = formatLikes(item.likes_count)
        val playbackUrl = VideoDeliveryManager.optimizeVideoUrl(item.stream_url ?: item.video_url)
        holder.binding.qualityBadge.text = VideoDeliveryManager.playbackBadge(playbackUrl)

        if (holder.player == null) {
            val trackSelector = DefaultTrackSelector(context).apply {
                parameters = buildUponParameters()
                    .setForceHighestSupportedBitrate(false)
                    .setAllowVideoMixedMimeTypeAdaptiveness(true)
                    .build()
            }
            val loadControl = DefaultLoadControl.Builder()
                .setBufferDurationsMs(2000, 10000, 1200, 2000)
                .build()
            val mediaSourceFactory = DefaultMediaSourceFactory(VideoCacheManager.getCacheDataSourceFactory(context))
            holder.player = ExoPlayer.Builder(context)
                .setTrackSelector(trackSelector)
                .setLoadControl(loadControl)
                .setMediaSourceFactory(mediaSourceFactory)
                .build().apply {
                    repeatMode = Player.REPEAT_MODE_ONE
                    playWhenReady = false
                }
            holder.binding.playerView.player = holder.player
        }

        holder.player?.clearMediaItems()
        holder.player?.setMediaItem(MediaItem.fromUri(Uri.parse(playbackUrl)))
        holder.player?.prepare()
        holder.player?.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                holder.binding.qualityBadge.alpha = if (playbackState == Player.STATE_BUFFERING) 0.7f else 1f
            }
        })

        if (position + 1 < list.size) {
            val next = VideoDeliveryManager.optimizeVideoUrl(list[position + 1].stream_url ?: list[position + 1].video_url)
            preloadManager?.preloadVideo(next)
        }
    }

    override fun onViewDetachedFromWindow(holder: VH) {
        holder.player?.pause()
        super.onViewDetachedFromWindow(holder)
    }

    override fun onViewRecycled(holder: VH) {
        super.onViewRecycled(holder)
        holder.player?.stop()
        holder.player?.release()
        holder.player = null
        holders.entries.removeAll { it.value == holder }
    }

    override fun getItemCount() = list.size

    override fun getItemId(position: Int): Long = list[position].id.toLong()

    fun playVideo(position: Int) {
        val target = list.getOrNull(position) ?: return
        holders.forEach { (index, holder) ->
            if (index == position) {
                holder.player?.playWhenReady = true
                holder.player?.play()
            } else {
                holder.player?.pause()
                holder.player?.playWhenReady = false
            }
        }
        onFocused(target)
        if (position + 1 < list.size) {
            val next = VideoDeliveryManager.optimizeVideoUrl(list[position + 1].stream_url ?: list[position + 1].video_url)
            preloadManager?.preloadVideo(next)
        }
    }

    fun appendItems(newItems: List<Reel>) {
        val start = list.size
        list.addAll(newItems)
        notifyItemRangeInserted(start, newItems.size)
    }

    fun currentItems(): List<Reel> = list.toList()

    fun release() {
        preloadManager?.release()
        holders.values.forEach {
            it.player?.release()
            it.player = null
        }
        holders.clear()
    }

    private fun formatLikes(value: Int): String {
        return when {
            value >= 1_000_000 -> String.format("%.1fM", value / 1_000_000f)
            value >= 1_000 -> String.format("%.1fK", value / 1_000f)
            else -> value.toString()
        }
    }
}
