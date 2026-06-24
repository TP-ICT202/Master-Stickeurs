package com.example.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

object MemeGeneratorUtil {

    /**
     * Fusionne un Bitmap d'arrière-plan avec les textes du haut et du bas,
     * dessinant des textes de style "impact meme" classique (blanc avec bordure noire).
     */
    fun createMeme(
        background: Bitmap,
        topText: String,
        bottomText: String
    ): Bitmap {
        // Redimensionner ou créer une copie mutable du bitmap
        val width = background.width
        val height = background.height
        val mutableBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(mutableBitmap)
        
        // Dessiner le fond
        canvas.drawBitmap(background, 0f, 0f, null)

        // Configurer les styles de pinceaux (Paint) pour le texte
        val textSize = (width * 0.08f).coerceIn(24f, 70f) // S'adapte à la taille de l'image
        
        val fillPaint = Paint().apply {
            color = Color.WHITE
            this.textSize = textSize
            style = Paint.Style.FILL
            textAlign = Paint.Align.CENTER
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            isAntiAlias = true
        }

        val strokePaint = Paint().apply {
            color = Color.BLACK
            this.textSize = textSize
            style = Paint.Style.STROKE
            strokeWidth = textSize * 0.15f
            textAlign = Paint.Align.CENTER
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            isAntiAlias = true
        }

        // Dessiner le texte du haut
        if (topText.isNotEmpty()) {
            val words = splitTextToFit(topText, width, fillPaint)
            var currentY = textSize + 20f
            for (line in words) {
                canvas.drawText(line, width / 2f, currentY, strokePaint)
                canvas.drawText(line, width / 2f, currentY, fillPaint)
                currentY += textSize + 10f
            }
        }

        // Dessiner le texte du bas
        if (bottomText.isNotEmpty()) {
            val words = splitTextToFit(bottomText, width, fillPaint)
            var currentY = height - 40f - (words.size - 1) * (textSize + 10f)
            for (line in words) {
                canvas.drawText(line, width / 2f, currentY, strokePaint)
                canvas.drawText(line, width / 2f, currentY, fillPaint)
                currentY += textSize + 10f
            }
        }

        return mutableBitmap
    }

    /**
     * Découpe le texte en plusieurs lignes s'il dépasse la largeur autorisée.
     */
    private fun splitTextToFit(text: String, maxWidth: Int, paint: Paint): List<String> {
        val uppercaseText = text.uppercase()
        val words = uppercaseText.split(" ")
        val lines = mutableListOf<String>()
        var currentLine = StringBuilder()
        val limit = maxWidth * 0.9f // Marge de 10% de chaque côté

        for (word in words) {
            val testLine = if (currentLine.isEmpty()) word else "${currentLine} $word"
            val width = paint.measureText(testLine)
            if (width < limit) {
                currentLine.append(if (currentLine.isEmpty()) word else " $word")
            } else {
                if (currentLine.isNotEmpty()) {
                    lines.add(currentLine.toString())
                }
                currentLine = StringBuilder(word)
            }
        }
        if (currentLine.isNotEmpty()) {
            lines.add(currentLine.toString())
        }

        return if (lines.isEmpty()) listOf(uppercaseText) else lines
    }

    /**
     * Enregistre un Bitmap localement et retourne son chemin d'accès absolu.
     */
    fun saveMemeToFile(context: Context, bitmap: Bitmap): String? {
        return try {
            val directory = File(context.filesDir, "saved_memes")
            if (!directory.exists()) {
                directory.mkdirs()
            }
            val fileName = "meme_${UUID.randomUUID()}.png"
            val file = File(directory, fileName)
            val out = FileOutputStream(file)
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
            out.flush()
            out.close()
            file.absolutePath
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * Applique les filtres visuels, réglages de luminosité, contraste et tracés tactiles sur un Bitmap de mème.
     */
    fun applyBitmapEdits(
        base: Bitmap,
        brightness: Float, // 1.0f original
        contrast: Float,   // 1.0f original
        filter: String,    // "Original", "Grayscale", "Sepia", "Invert", "Teal", "Amber", "Neon"
        scribbles: List<Pair<Float, Float>>? = null, // coordonnees normalisees (0f..1f)
        scribbleColor: Int = Color.RED
    ): Bitmap {
        val width = base.width
        val height = base.height
        val result = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(result)
        
        val paint = Paint().apply {
            isAntiAlias = true
        }
        
        // Construct ColorMatrix for contrast and brightness
        val cm = android.graphics.ColorMatrix()
        val scale = contrast
        val translate = (brightness - 1.0f) * 255f
        val matrixValues = floatArrayOf(
            scale, 0f, 0f, 0f, translate,
            0f, scale, 0f, 0f, translate,
            0f, 0f, scale, 0f, translate,
            0f, 0f, 0f, 1f, 0f
        )
        cm.set(matrixValues)
        
        // Concat basic filters
        when (filter) {
            "Grayscale" -> {
                val grayscaleMatrix = android.graphics.ColorMatrix()
                grayscaleMatrix.setSaturation(0f)
                cm.postConcat(grayscaleMatrix)
            }
            "Sepia" -> {
                val sepiaMatrix = android.graphics.ColorMatrix().apply {
                    setScale(1f, 0.95f, 0.82f, 1.0f)
                }
                cm.postConcat(sepiaMatrix)
            }
            "Invert" -> {
                val invertMatrix = android.graphics.ColorMatrix(floatArrayOf(
                    -1f, 0f, 0f, 0f, 255f,
                    0f, -1f, 0f, 0f, 255f,
                    0f, 0f, -1f, 0f, 255f,
                    0f, 0f, 0f, 1f, 0f
                ))
                cm.postConcat(invertMatrix)
            }
            "Teal Glow" -> {
                val tealMatrix = android.graphics.ColorMatrix().apply {
                    setScale(0.7f, 1.2f, 1.2f, 1.0f)
                }
                cm.postConcat(tealMatrix)
            }
            "Amber Glow" -> {
                val amberMatrix = android.graphics.ColorMatrix().apply {
                    setScale(1.3f, 0.9f, 0.6f, 1.0f)
                }
                cm.postConcat(amberMatrix)
            }
            "Neon Violet" -> {
                val violetMatrix = android.graphics.ColorMatrix().apply {
                    setScale(1.2f, 0.6f, 1.2f, 1.0f)
                }
                cm.postConcat(violetMatrix)
            }
        }
        
        paint.colorFilter = android.graphics.ColorMatrixColorFilter(cm)
        
        // Render base bitmap with edits applied
        val filteredBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val filteredCanvas = Canvas(filteredBitmap)
        filteredCanvas.drawBitmap(base, 0f, 0f, paint)
        
        // Draw the filtered result onto our main canvas
        paint.colorFilter = null
        canvas.drawBitmap(filteredBitmap, 0f, 0f, paint)
        
        // Draw finger scribbles
        if (!scribbles.isNullOrEmpty()) {
            val linePaint = Paint().apply {
                color = scribbleColor
                strokeWidth = width * 0.015f
                style = Paint.Style.STROKE
                strokeCap = Paint.Cap.ROUND
                strokeJoin = Paint.Join.ROUND
                isAntiAlias = true
            }
            
            val path = android.graphics.Path()
            var first = true
            for (point in scribbles) {
                val x = point.first * width
                val y = point.second * height
                if (first) {
                    path.moveTo(x, y)
                    first = false
                } else {
                    path.lineTo(x, y)
                }
            }
            canvas.drawPath(path, linePaint)
        }
        
        return result
    }
}
