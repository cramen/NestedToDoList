package com.todoapp.routes

import com.todoapp.dto.*
import com.todoapp.services.TaskService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.configureTaskRoutes() {
    val taskService = TaskService()
    
    route("/api/tasks") {
        
        // Get all tasks as tree structure
        get {
            try {
                val tasks = taskService.getAllTasks()
                call.respond(TaskListResponse(
                    success = true,
                    message = "Tasks retrieved successfully",
                    data = tasks
                ))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, TaskListResponse(
                    success = false,
                    message = "Failed to retrieve tasks: ${e.message}"
                ))
            }
        }
        
        // Get deepest level tasks only
        get("/deepest") {
            try {
                val tasks = taskService.getDeepestTasks()
                call.respond(TaskListResponse(
                    success = true,
                    message = "Deepest tasks retrieved successfully",
                    data = tasks
                ))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, TaskListResponse(
                    success = false,
                    message = "Failed to retrieve deepest tasks: ${e.message}"
                ))
            }
        }
        
        // Get specific task with its tree
        get("/{id}/tree") {
            try {
                val id = call.parameters["id"]?.toLongOrNull()
                if (id == null) {
                    call.respond(HttpStatusCode.BadRequest, TaskResponse(
                        success = false,
                        message = "Invalid task ID"
                    ))
                    return@get
                }
                
                val task = taskService.getTaskTree(id)
                if (task != null) {
                    call.respond(TaskResponse(
                        success = true,
                        message = "Task tree retrieved successfully",
                        data = task
                    ))
                } else {
                    call.respond(HttpStatusCode.NotFound, TaskResponse(
                        success = false,
                        message = "Task not found"
                    ))
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, TaskResponse(
                    success = false,
                    message = "Failed to retrieve task tree: ${e.message}"
                ))
            }
        }
        
        // Get specific task
        get("/{id}") {
            try {
                val id = call.parameters["id"]?.toLongOrNull()
                if (id == null) {
                    call.respond(HttpStatusCode.BadRequest, TaskResponse(
                        success = false,
                        message = "Invalid task ID"
                    ))
                    return@get
                }
                
                val task = taskService.getTaskById(id)
                if (task != null) {
                    call.respond(TaskResponse(
                        success = true,
                        message = "Task retrieved successfully",
                        data = task
                    ))
                } else {
                    call.respond(HttpStatusCode.NotFound, TaskResponse(
                        success = false,
                        message = "Task not found"
                    ))
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, TaskResponse(
                    success = false,
                    message = "Failed to retrieve task: ${e.message}"
                ))
            }
        }
        
        // Create new task
        post {
            try {
                val request = call.receive<CreateTaskRequest>()
                if (request.title.isBlank()) {
                    call.respond(HttpStatusCode.BadRequest, TaskResponse(
                        success = false,
                        message = "Task title cannot be empty"
                    ))
                    return@post
                }
                
                val task = taskService.createTask(request)
                call.respond(HttpStatusCode.Created, TaskResponse(
                    success = true,
                    message = "Task created successfully",
                    data = task
                ))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, TaskResponse(
                    success = false,
                    message = "Failed to create task: ${e.message}"
                ))
            }
        }
        
        // Add sibling task
        post("/{id}/sibling") {
            try {
                val id = call.parameters["id"]?.toLongOrNull()
                if (id == null) {
                    call.respond(HttpStatusCode.BadRequest, TaskResponse(
                        success = false,
                        message = "Invalid task ID"
                    ))
                    return@post
                }
                
                val request = call.receive<CreateTaskRequest>()
                if (request.title.isBlank()) {
                    call.respond(HttpStatusCode.BadRequest, TaskResponse(
                        success = false,
                        message = "Task title cannot be empty"
                    ))
                    return@post
                }
                
                val task = taskService.addSiblingTask(id, request)
                if (task != null) {
                    call.respond(HttpStatusCode.Created, TaskResponse(
                        success = true,
                        message = "Sibling task created successfully",
                        data = task
                    ))
                } else {
                    call.respond(HttpStatusCode.NotFound, TaskResponse(
                        success = false,
                        message = "Parent task not found"
                    ))
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, TaskResponse(
                    success = false,
                    message = "Failed to create sibling task: ${e.message}"
                ))
            }
        }
        
        // Update task
        put("/{id}") {
            try {
                val id = call.parameters["id"]?.toLongOrNull()
                if (id == null) {
                    call.respond(HttpStatusCode.BadRequest, TaskResponse(
                        success = false,
                        message = "Invalid task ID"
                    ))
                    return@put
                }
                
                val request = call.receive<UpdateTaskRequest>()
                val task = taskService.updateTask(id, request)
                if (task != null) {
                    call.respond(TaskResponse(
                        success = true,
                        message = "Task updated successfully",
                        data = task
                    ))
                } else {
                    call.respond(HttpStatusCode.NotFound, TaskResponse(
                        success = false,
                        message = "Task not found"
                    ))
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, TaskResponse(
                    success = false,
                    message = "Failed to update task: ${e.message}"
                ))
            }
        }
        
        // Delete task
        delete("/{id}") {
            try {
                val id = call.parameters["id"]?.toLongOrNull()
                if (id == null) {
                    call.respond(HttpStatusCode.BadRequest, TaskResponse(
                        success = false,
                        message = "Invalid task ID"
                    ))
                    return@delete
                }
                
                val success = taskService.deleteTask(id)
                if (success) {
                    call.respond(TaskResponse(
                        success = true,
                        message = "Task deleted successfully"
                    ))
                } else {
                    call.respond(HttpStatusCode.NotFound, TaskResponse(
                        success = false,
                        message = "Task not found"
                    ))
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, TaskResponse(
                    success = false,
                    message = "Failed to delete task: ${e.message}"
                ))
            }
        }
    }
}
