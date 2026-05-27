package com.socialapp.activities

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.socialapp.adapters.GroupsListAdapter
import com.socialapp.databinding.ActivityGroupsListBinding
import com.socialapp.models.GroupInfo
import com.socialapp.network.ApiClient
import com.socialapp.utils.AppAnalytics
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import com.socialapp.utils.UiKit
import com.socialapp.utils.AppDialogs

class GroupsListActivity : AppCompatActivity() {

    private lateinit var binding: ActivityGroupsListBinding
    private lateinit var groupsAdapter: GroupsListAdapter
    private val groups = mutableListOf<GroupInfo>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityGroupsListBinding.inflate(layoutInflater)
        setContentView(binding.root)
        UiKit.prepareScreen(this, binding.root)

        setupRecyclerView()
        setupButtons()
        loadGroups()
    }

    override fun onResume() {
        super.onResume()
        AppAnalytics.trackScreen("groups_list")
        loadGroups()
    }

    private fun setupRecyclerView() {
        groupsAdapter = GroupsListAdapter(groups) { group ->
            openGroupChat(group)
        }
        binding.groupsRecycler.layoutManager = LinearLayoutManager(this)
        binding.groupsRecycler.adapter = groupsAdapter
    }

    private fun setupButtons() {
        binding.createGroupBtn.setOnClickListener { showCreateGroupDialog() }
        binding.refreshBtn.setOnClickListener { loadGroups() }
    }

    private fun loadGroups() {
        UiKit.setVisible(binding.progressBar, true)
        ApiClient.api.getGroups().enqueue(object : Callback<List<GroupInfo>> {
            override fun onResponse(call: Call<List<GroupInfo>>, response: Response<List<GroupInfo>>) {
                UiKit.setVisible(binding.progressBar, false)
                val newGroups = response.body().orEmpty()
                groups.clear()
                groups.addAll(newGroups)
                groupsAdapter.notifyDataSetChanged()
                
                if (groups.isEmpty()) {
                    UiKit.setVisible(binding.emptyState, true)
                    UiKit.setVisible(binding.groupsRecycler, false)
                } else {
                    UiKit.setVisible(binding.emptyState, false)
                    UiKit.setVisible(binding.groupsRecycler, true)
                }
            }

            override fun onFailure(call: Call<List<GroupInfo>>, t: Throwable) {
                UiKit.setVisible(binding.progressBar, false)
                toast(t.message ?: "فشل تحميل المجموعات")
            }
        })
    }

    private fun showCreateGroupDialog() {
        val input = AppDialogs.input(this).apply {
            hint = "اسم المجموعة"
            setPadding(16, 16, 16, 16)
        }

        AppDialogs.builder(this)
            .setTitle("إنشاء مجموعة جديدة")
            .setView(input)
            .setPositiveButton("إنشاء") { _, _ ->
                val groupName = input.text.toString().trim()
                if (groupName.isNotEmpty()) {
                    createGroup(groupName)
                } else {
                    toast("أدخل اسم المجموعة")
                }
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun createGroup(name: String) {
        UiKit.setVisible(binding.progressBar, true)
        ApiClient.api.createGroup(mapOf("name" to name)).enqueue(object : Callback<com.socialapp.models.ApiMessage> {
            override fun onResponse(call: Call<com.socialapp.models.ApiMessage>, response: Response<com.socialapp.models.ApiMessage>) {
                UiKit.setVisible(binding.progressBar, false)
                toast("تم إنشاء المجموعة")
                loadGroups()
            }

            override fun onFailure(call: Call<com.socialapp.models.ApiMessage>, t: Throwable) {
                UiKit.setVisible(binding.progressBar, false)
                toast(t.message ?: "فشل إنشاء المجموعة")
            }
        })
    }

    private fun openGroupChat(group: GroupInfo) {
        if (group.isMember) {
            startActivity(Intent(this, GroupChatActivity::class.java).apply {
                putExtra("group_id", group.id)
            })
        } else {
            showJoinGroupDialog(group)
        }
    }

    private fun showJoinGroupDialog(group: GroupInfo) {
        AppDialogs.builder(this)
            .setTitle("الانضمام للمجموعة")
            .setMessage("هل تريد الانضمام إلى مجموعة '${group.name}'؟")
            .setPositiveButton("انضم") { _, _ ->
                joinGroup(group)
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun joinGroup(group: GroupInfo) {
        UiKit.setVisible(binding.progressBar, true)
        ApiClient.api.joinGroup(group.id).enqueue(object : Callback<com.socialapp.models.ApiMessage> {
            override fun onResponse(call: Call<com.socialapp.models.ApiMessage>, response: Response<com.socialapp.models.ApiMessage>) {
                UiKit.setVisible(binding.progressBar, false)
                toast("تم الانضمام للمجموعة")
                startActivity(Intent(this@GroupsListActivity, GroupChatActivity::class.java).apply {
                    putExtra("group_id", group.id)
                })
            }

            override fun onFailure(call: Call<com.socialapp.models.ApiMessage>, t: Throwable) {
                UiKit.setVisible(binding.progressBar, false)
                toast(t.message ?: "فشل الانضمام للمجموعة")
            }
        })
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}
