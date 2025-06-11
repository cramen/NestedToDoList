package com.todoapp.dto

import kotlinx.serialization.Serializable

@Serializable
data class CreateTaskRequest(
    val title: String,
    val description: String? = null,
    val parentId: Long? = null,
    val position: Int = 0
)

@Serializable
data class UpdateTaskRequest(
    val title: String? = null,
    val description: String? = null,
    val isCompleted: Boolean? = null,
    val position: Int? = null
)

@Serializable
data class TaskResponse(
    val success: Boolean,
    val message: String,
    val data: com.todoapp.models.Task? = null
)

@Serializable
data class TaskListResponse(
    val success: Boolean,
    val message: String,
    val data: List<com.todoapp.models.Task> = emptyList()
)
