package com.example.data.database

import kotlinx.coroutines.flow.Flow

class MemeRepository(private val memeDao: MemeDao) {
    val allMemes: Flow<List<MemeEntity>> = memeDao.getAllMemes()

    suspend fun insert(meme: MemeEntity): Long {
        return memeDao.insertMeme(meme)
    }

    suspend fun delete(meme: MemeEntity) {
        memeDao.deleteMeme(meme)
    }

    suspend fun deleteById(id: Int) {
        memeDao.deleteMemeById(id)
    }
}
