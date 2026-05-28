package com.socialapp.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.socialapp.databinding.ItemGroupBinding
import com.socialapp.models.GroupInfo

class GroupsListAdapter(
    private val groups: List<GroupInfo>,
    private val onGroupClick: (GroupInfo) -> Unit
) : RecyclerView.Adapter<GroupsListAdapter.ViewHolder>() {

    inner class ViewHolder(private val binding: ItemGroupBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(group: GroupInfo) {
            binding.groupName.text = group.name
            binding.membersCount.text = "${group.membersCount} أعضاء"
            binding.ownerName.text = "المالك: ${group.owner}"
            
            // Load avatar
            if (!group.avatarUrl.isNullOrEmpty()) {
                Glide.with(binding.root.context)
                    .load(group.avatarUrl)
                    .diskCacheStrategy(DiskCacheStrategy.NONE)
                    .centerCrop()
                    .into(binding.groupAvatar)
            } else {
                binding.groupAvatar.setImageResource(android.R.drawable.ic_menu_gallery)
            }
            
            // Set member status
            binding.memberStatus.text = if (group.isMember) "عضو" else "غير عضو"
            binding.memberStatus.setTextColor(
                binding.root.context.getColor(
                    if (group.isMember) android.R.color.holo_green_light 
                    else android.R.color.holo_orange_light
                )
            )
            
            binding.root.setOnClickListener {
                onGroupClick(group)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemGroupBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(groups[position])
    }

    override fun getItemCount() = groups.size
}
