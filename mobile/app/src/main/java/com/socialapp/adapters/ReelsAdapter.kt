package com.socialapp.adapters

import android.app.AlertDialog
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import android.widget.VideoView
import androidx.recyclerview.widget.RecyclerView
import com.socialapp.databinding.ItemReelBinding
import com.socialapp.models.Reel
import com.socialapp.network.ApiClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class ReelsAdapter(
    private val list: MutableList<Reel>,
    private val onReelDeleted: ((Reel) -> Unit)? = null
) : RecyclerView.Adapter<ReelsAdapter.VH>() {

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

        // ============================================================
        // الزر العائم لسحب الريل (على الجهة اليسرى = start في RTL)
        // ============================================================
        // - نقر طويل: يفتح قائمة (حذف الريل) — وحذف الريل يحذف الستوري المرتبط
        // - سحب رأسي (drag): يبلّغ الـ ViewPager بطلب تغيير الصفحة
        holder.binding.dragReelFab.setOnLongClickListener {
            showReelOptions(holder, item)
            true
        }

        var downY = 0f
        holder.binding.dragReelFab.setOnTouchListener { v, ev ->
            when (ev.action) {
                MotionEvent.ACTION_DOWN -> {
                    downY = ev.rawY
                    false
                }
                MotionEvent.ACTION_UP -> {
                    val dy = ev.rawY - downY
                    if (kotlin.math.abs(dy) > 80) {
                        // سحب رأسي: ننقل التركيز للريل التالي/السابق
                        Toast.makeText(
                            v.context,
                            if (dy < 0) "الريل التالي" else "الريل السابق",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                    v.performClick()
                    true
                }
                else -> false
            }
        }
    }

    private fun showReelOptions(holder: VH, item: Reel) {
        val ctx = holder.itemView.context
        val options = arrayOf("حذف الريل (يحذف الستوري المرتبط)")
        AlertDialog.Builder(ctx)
            .setTitle("خيارات الريل")
            .setItems(options) { _, which ->
                if (which == 0) confirmDeleteReel(holder, item)
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun confirmDeleteReel(holder: VH, item: Reel) {
        val ctx = holder.itemView.context
        AlertDialog.Builder(ctx)
            .setTitle("حذف الريل")
            .setMessage("سيتم حذف هذا الريل، وستُحذف معه القصة (Story) المرتبطة به تلقائياً.")
            .setPositiveButton("حذف") { _, _ ->
                ApiClient.api.deleteReel(item.id.toString(), cascadeStories = true)
                    .enqueue(object : Callback<Map<String, Any>> {
                        override fun onResponse(
                            call: Call<Map<String, Any>>,
                            response: Response<Map<String, Any>>
                        ) {
                            if (response.isSuccessful) {
                                val pos = list.indexOf(item)
                                if (pos >= 0) {
                                    list.removeAt(pos)
                                    notifyItemRemoved(pos)
                                }
                                Toast.makeText(ctx, "تم حذف الريل والستوري المرتبط", Toast.LENGTH_SHORT).show()
                                onReelDeleted?.invoke(item)
                            } else {
                                Toast.makeText(ctx, "تعذر حذف الريل (${response.code()})", Toast.LENGTH_SHORT).show()
                            }
                        }

                        override fun onFailure(call: Call<Map<String, Any>>, t: Throwable) {
                            Toast.makeText(ctx, t.message ?: "تعذر حذف الريل", Toast.LENGTH_SHORT).show()
                        }
                    })
            }
            .setNegativeButton("إلغاء", null)
            .show()
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
