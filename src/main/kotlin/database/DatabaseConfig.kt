package com.todoapp.database

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction

object DatabaseConfig {
    fun init() {
        val config = HikariConfig().apply {
            val dbUrl = System.getenv("DATABASE_URL") ?: buildPostgresUrl()
            jdbcUrl = dbUrl
            driverClassName = "org.postgresql.Driver"
            maximumPoolSize = 10
            isAutoCommit = false
            transactionIsolation = "TRANSACTION_REPEATABLE_READ"
            validate()
        }
        
        Database.connect(HikariDataSource(config))
        
        transaction {
            SchemaUtils.create(TaskTable)
        }
    }
    
    private fun buildPostgresUrl(): String {
        val host = System.getenv("PGHOST") ?: "localhost"
        val port = System.getenv("PGPORT") ?: "5432"
        val database = System.getenv("PGDATABASE") ?: "todoapp"
        val user = System.getenv("PGUSER") ?: "postgres"
        val password = System.getenv("PGPASSWORD") ?: "password"
        
        return "jdbc:postgresql://$host:$port/$database?user=$user&password=$password"
    }
}
