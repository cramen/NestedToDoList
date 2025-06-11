package com.todoapp.models

import kotlinx.serialization.Serializable
import java.time.LocalDateTime

@Serializable
data class Task(
    val id: Long,
    val title: String,
    val description: String?,
    val isCompleted: Boolean = false,
    val parentId: Long? = null,
    val position: Int = 0,
    val children: List<Task> = emptyList(),
    val createdAt: String,
    val updatedAt: String
)
