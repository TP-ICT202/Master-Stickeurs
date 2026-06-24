package com.example.util

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader

object TemplateGenerator {

    data class PresetTemplate(
        val name: String,
        val startColor: Int,
        val endColor: Int,
        val pattern: Int // 0: Linear Gradient, 1: Radial Gradient, 2: Cyber Grid, 3: Retro Stripes
    )

    val PRESETS = listOf(
        PresetTemplate("Vaporwave Sunset", Color.parseColor("#FF007F"), Color.parseColor("#00F0FF"), 1),
        PresetTemplate("Toxic Matrix", Color.parseColor("#0D0D00"), Color.parseColor("#00FF66"), 2),
        PresetTemplate("Cosmic Magenta", Color.parseColor("#4A0E4E"), Color.parseColor("#E43F5A"), 0),
        PresetTemplate("Midnight Gold", Color.parseColor("#1B1A17"), Color.parseColor("#F0A500"), 3),
        PresetTemplate("Neon Cyberpunk", Color.parseColor("#1C0A35"), Color.parseColor("#05DFD7"), 2),
        PresetTemplate("Cameroun Green-Red", Color.parseColor("#007A5E"), Color.parseColor("#CE1126"), 0),
        PresetTemplate("Ocean Breeze", Color.parseColor("#082F49"), Color.parseColor("#0EA5E9"), 1),
        PresetTemplate("Emerald Jungle", Color.parseColor("#064E3B"), Color.parseColor("#10B981"), 2),
        PresetTemplate("Crimson Red", Color.parseColor("#450A0A"), Color.parseColor("#EF4444"), 3),
        PresetTemplate("Sunset Orange", Color.parseColor("#7C2D12"), Color.parseColor("#F97316"), 0)
    )

    /**
     * Génère un Bitmap haute résolution correspondant à un certain preset.
     */
    fun generatePresetBitmap(presetIndex: Int, width: Int = 1000, height: Int = 1000): Bitmap {
        val preset = PRESETS.getOrElse(presetIndex) { PRESETS[0] }
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val paint = Paint()

        // 1. Fond de base (Gradient)
        if (preset.pattern == 1) {
            // Radial Gradient
            val gradient = RadialGradient(
                width / 2f, height / 2f, width * 0.7f,
                preset.startColor, preset.endColor, Shader.TileMode.CLAMP
            )
            paint.shader = gradient
            canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
        } else {
            // Linear Gradient
            val gradient = LinearGradient(
                0f, 0f, width.toFloat(), height.toFloat(),
                preset.startColor, preset.endColor, Shader.TileMode.CLAMP
            )
            paint.shader = gradient
            canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
        }
        paint.shader = null // Reset shader

        // 2. Patterns géométriques ou artistiques pour un effet meme ultra poli
        when (preset.pattern) {
            2 -> { // Cyber Grid
                paint.apply {
                    color = Color.WHITE
                    alpha = 30
                    strokeWidth = 3f
                    style = Paint.Style.STROKE
                }
                val step = width / 12
                for (i in 0..width step step) {
                    canvas.drawLine(i.toFloat(), 0f, i.toFloat(), height.toFloat(), paint)
                    canvas.drawLine(0f, i.toFloat(), width.toFloat(), i.toFloat(), paint)
                }
            }
            3 -> { // Retro Stripes (Stries obliques)
                paint.apply {
                    color = Color.BLACK
                    alpha = 40
                    strokeWidth = 25f
                    style = Paint.Style.STROKE
                }
                val step = width / 8
                for (i in -width..width step step) {
                    canvas.drawLine(i.toFloat(), 0f, (i + width).toFloat(), height.toFloat(), paint)
                }
            }
            else -> {
                // Cercles concentriques transparents
                paint.apply {
                    color = Color.WHITE
                    alpha = 15
                    style = Paint.Style.FILL
                }
                canvas.drawCircle(width * 0.3f, height * 0.3f, width * 0.25f, paint)
                canvas.drawCircle(width * 0.8f, height * 0.7f, width * 0.15f, paint)
            }
        }

        // 3. Cadre interne néon de style mème
        paint.apply {
            color = Color.WHITE
            alpha = 50
            strokeWidth = 10f
            style = Paint.Style.STROKE
        }
        canvas.drawRect(20f, 20f, width - 20f, height - 20f, paint)

        return bitmap
    }
}
