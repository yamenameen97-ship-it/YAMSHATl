package com.socialapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.socialapp.viewmodels.ChatViewModel
import com.socialapp.ui.components.ChatMessageItem
import com.socialapp.network.SessionManager

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(viewModel: ChatViewModel, receiver: String) {
    val messages by viewModel.messages.observeAsState(emptyList())
    val currentUsername = SessionManager.getUsername()

    Scaffold(
        topBar = {
            TopAppBar(title = { Text(receiver) })
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                reverseLayout = true
            ) {
                items(messages) { message ->
                    ChatMessageItem(
                        message = message,
                        isCurrentUser = message.sender == currentUsername
                    )
                }
            }
            // Input area can be added here
        }
    }
}
