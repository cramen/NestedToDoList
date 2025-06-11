package com.todoapp.services

import com.todoapp.database.TaskTable
import com.todoapp.dto.CreateTaskRequest
import com.todoapp.dto.UpdateTaskRequest
import com.todoapp.models.Task
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDateTime

class TaskService {
    
    fun getAllTasks(): List<Task> = transaction {
        val allTasks = TaskTable.selectAll().map { rowToTask(it) }
        buildTaskTree(allTasks)
    }
    
    fun getDeepestTasks(): List<Task> = transaction {
        // Get tasks that have no children (deepest level)
        val tasksWithChildren = TaskTable.slice(TaskTable.parentId)
            .select { TaskTable.parentId.isNotNull() }
            .map { it[TaskTable.parentId] }
            .toSet()
        
        TaskTable.select { TaskTable.id notInList tasksWithChildren }
            .map { rowToTask(it) }
    }
    
    fun getTaskById(id: Long): Task? = transaction {
        TaskTable.select { TaskTable.id eq id }
            .map { rowToTask(it) }
            .singleOrNull()
    }
    
    fun createTask(request: CreateTaskRequest): Task = transaction {
        val id = TaskTable.insertAndGetId {
            it[title] = request.title
            it[description] = request.description
            it[parentId] = request.parentId
            it[position] = request.position
            it[createdAt] = LocalDateTime.now()
            it[updatedAt] = LocalDateTime.now()
        }
        
        getTaskById(id.value)!!
    }
    
    fun updateTask(id: Long, request: UpdateTaskRequest): Task? = transaction {
        val updated = TaskTable.update({ TaskTable.id eq id }) {
            request.title?.let { title -> it[TaskTable.title] = title }
            request.description?.let { desc -> it[description] = desc }
            request.isCompleted?.let { completed -> it[isCompleted] = completed }
            request.position?.let { pos -> it[position] = pos }
            it[updatedAt] = LocalDateTime.now()
        }
        
        if (updated > 0) getTaskById(id) else null
    }
    
    fun deleteTask(id: Long): Boolean = transaction {
        // First delete all children recursively
        deleteTaskAndChildren(id)
        true
    }
    
    private fun deleteTaskAndChildren(id: Long) {
        // Get all children
        val children = TaskTable.select { TaskTable.parentId eq id }
            .map { it[TaskTable.id].value }
        
        // Recursively delete children
        children.forEach { childId ->
            deleteTaskAndChildren(childId)
        }
        
        // Delete the task itself
        TaskTable.deleteWhere { TaskTable.id eq id }
    }
    
    fun getTaskTree(rootId: Long): Task? = transaction {
        val task = getTaskById(rootId) ?: return@transaction null
        val allTasks = TaskTable.selectAll().map { rowToTask(it) }
        buildTaskTreeFromRoot(allTasks, rootId)
    }
    
    fun addSiblingTask(taskId: Long, request: CreateTaskRequest): Task? = transaction {
        val siblingTask = getTaskById(taskId) ?: return@transaction null
        val parentId = siblingTask.parentId
        
        // Find the highest position among siblings
        val maxPosition = if (parentId != null) {
            TaskTable.select { TaskTable.parentId eq parentId }
                .maxOfOrNull { it[TaskTable.position] } ?: 0
        } else {
            TaskTable.select { TaskTable.parentId.isNull() }
                .maxOfOrNull { it[TaskTable.position] } ?: 0
        }
        
        createTask(request.copy(parentId = parentId, position = maxPosition + 1))
    }
    
    private fun rowToTask(row: ResultRow): Task {
        return Task(
            id = row[TaskTable.id].value,
            title = row[TaskTable.title],
            description = row[TaskTable.description],
            isCompleted = row[TaskTable.isCompleted],
            parentId = row[TaskTable.parentId]?.value,
            position = row[TaskTable.position],
            createdAt = row[TaskTable.createdAt].toString(),
            updatedAt = row[TaskTable.updatedAt].toString()
        )
    }
    
    private fun buildTaskTree(tasks: List<Task>): List<Task> {
        val taskMap = tasks.associateBy { it.id }.toMutableMap()
        val rootTasks = mutableListOf<Task>()
        
        tasks.forEach { task ->
            if (task.parentId == null) {
                rootTasks.add(task)
            } else {
                val parent = taskMap[task.parentId]
                if (parent != null) {
                    taskMap[parent.id] = parent.copy(
                        children = parent.children + task
                    )
                }
            }
        }
        
        return rootTasks.sortedBy { it.position }
    }
    
    private fun buildTaskTreeFromRoot(tasks: List<Task>, rootId: Long): Task? {
        val taskMap = tasks.associateBy { it.id }
        val root = taskMap[rootId] ?: return null
        
        fun attachChildren(task: Task): Task {
            val children = tasks.filter { it.parentId == task.id }
                .map { attachChildren(it) }
                .sortedBy { it.position }
            return task.copy(children = children)
        }
        
        return attachChildren(root)
    }
}
