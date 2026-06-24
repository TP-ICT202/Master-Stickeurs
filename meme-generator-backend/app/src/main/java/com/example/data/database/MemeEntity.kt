package com.example.data.database

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "memes")
data class MemeEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val type: String,               // "TEXT", "AUDIO", "IMAGE"
    val contextText: String,        // Saisie utilisateur ou transcription
    val topText: String,            // Texte du meme en haut
    val bottomText: String,         // Texte du meme en bas
    val audioPath: String? = null,  // Chemin de la note vocale enregistrée
    val imagePath: String? = null,  // Chemin vers le fichier local PNG du meme complet
    val timestamp: Long = System.currentTimeMillis()
)
