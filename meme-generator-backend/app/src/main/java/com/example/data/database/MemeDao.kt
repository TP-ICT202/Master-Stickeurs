package com.example.data.database

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface MemeDao {
    @Query("SELECT * FROM memes ORDER BY timestamp DESC")
    fun getAllMemes(): Flow<List<MemeEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMeme(meme: MemeEntity): Long

    @Delete
    suspend fun deleteMeme(meme: MemeEntity)

    @Query("DELETE FROM memes WHERE id = :id")
    suspend fun deleteMemeById(id: Int)
}
