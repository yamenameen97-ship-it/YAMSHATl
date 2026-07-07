package com.socialapp.activities

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
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

class GroupsListActivity : AppCompatActivity() {

    private lateinit var binding: ActivityGroupsListBinding
    private lateinit var groupsAdapter: GroupsListAdapter
    private val groups = mutableListOf<GroupInfo>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityGroupsListBinding.inflate(layoutInflater)
        setContentView(binding.root)

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
        binding.progressBar.visibility = android.view.View.VISIBLE
        ApiClient.api.getGroups().enqueue(object : Callback<List<GroupInfo>> {
            override fun onResponse(call: Call<List<GroupInfo>>, response: Response<List<GroupInfo>>) {
                binding.progressBar.visibility = android.view.View.GONE
                val newGroups = response.body().orEmpty()
                groups.clear()
                groups.addAll(newGroups)
                groupsAdapter.notifyDataSetChanged()
                
                if (groups.isEmpty()) {
                    binding.emptyState.visibility = android.view.View.VISIBLE
                    binding.groupsRecycler.visibility = android.view.View.GONE
                } else {
                    binding.emptyState.visibility = android.view.View.GONE
                    binding.groupsRecycler.visibility = android.view.View.VISIBLE
                }
            }

            override fun onFailure(call: Call<List<GroupInfo>>, t: Throwable) {
                binding.progressBar.visibility = android.view.View.GONE
                toast(t.message ?: "فشل تحميل المجموعات")
            }
        })
    }

    private fun showCreateGroupDialog() {
        val input = android.widget.EditText(this).apply {
            hint = "اسم المجموعة"
            setPadding(16, 16, 16, 16)
        }

        AlertDialog.Builder(this)
            .setTitle("إنشاء مجموعة جديدة")
            .setView(input)
            .setPositiveButton("إنشاء") { _, _ ->
                val groupName = input.text.toString().trim()
                when {
                    groupName.isEmpty() -> toast("أدخل اسم المجموعة")
                    groupName.length < 2 -> toast("الاسم قصير جداً")
                    groupName.length > 60 -> toast("الاسم طويل جداً (٣٠ حد أقصى)")
                    else -> createGroup(groupName)
                }
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun createGroup(name: String) {
        binding.progressBar.visibility = android.view.View.VISIBLE
        val payload = mapOf(
            "name" to name,
            "description" to "",
            "category" to "",
        )
        ApiClient.api.createGroup(payload).enqueue(object : Callback<com.socialapp.models.ApiMessage> {
            override fun onResponse(call: Call<com.socialapp.models.ApiMessage>, response: Response<com.socialapp.models.ApiMessage>) {
                binding.progressBar.visibility = android.view.View.GONE
                if (response.isSuccessful) {
                    toast("تم إنشاء المجموعة")
                    loadGroups()
                } else {
                    toast("فشل إنشاء المجموعة (${response.code()})")
                }
            }

            override fun onFailure(call: Call<com.socialapp.models.ApiMessage>, t: Throwable) {
                binding.progressBar.visibility = android.view.View.GONE
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
        AlertDialog.Builder(this)
            .setTitle("الانضمام للمجموعة")
            .setMessage("هل تريد الانضمام إلى مجموعة '${group.name}'؟")
            .setPositiveButton("انضم") { _, _ ->
                joinGroup(group)
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun joinGroup(group: GroupInfo) {
        binding.progressBar.visibility = android.view.View.VISIBLE
        ApiClient.api.joinGroup(group.id).enqueue(object : Callback<com.socialapp.models.ApiMessage> {
            override fun onResponse(call: Call<com.socialapp.models.ApiMessage>, response: Response<com.socialapp.models.ApiMessage>) {
                binding.progressBar.visibility = android.view.View.GONE
                toast("تم الانضمام للمجموعة")
                startActivity(Intent(this@GroupsListActivity, GroupChatActivity::class.java).apply {
                    putExtra("group_id", group.id)
                })
            }

            override fun onFailure(call: Call<com.socialapp.models.ApiMessage>, t: Throwable) {
                binding.progressBar.visibility = android.view.View.GONE
                toast(t.message ?: "فشل الانضمام للمجموعة")
            }
        })
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}
