package com.socialapp.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.socialapp.R
import com.socialapp.adapters.StoriesAdapter
import com.socialapp.repositories.StoriesRepository

class StoriesFragment : Fragment() {
    private val storiesRepository = StoriesRepository()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View = inflater.inflate(R.layout.fragment_stories, container, false)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val recyclerView = view.findViewById<androidx.recyclerview.widget.RecyclerView>(R.id.storiesList)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())
        storiesRepository.loadStories { stories ->
            if (!isAdded) return@loadStories
            recyclerView.adapter = StoriesAdapter(stories)
        }
    }
}
