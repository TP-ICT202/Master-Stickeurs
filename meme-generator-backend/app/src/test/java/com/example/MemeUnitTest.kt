package com.example

import android.graphics.Bitmap
import com.example.util.MemeGeneratorUtil
import com.example.util.TemplateGenerator
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Tests unitaires pour les utilitaires de génération de memes.
 * Ces tests s'exécutent sur la JVM (pas besoin d'émulateur).
 *
 * Lancer : ./gradlew testDebugUnitTest
 */
class MemeUnitTest {

    // ----------------------------------------------------------
    // TemplateGenerator
    // ----------------------------------------------------------

    @Test
    fun `templateGenerator returns non-null bitmap for all presets`() {
        for (i in TemplateGenerator.PRESETS.indices) {
            val bitmap = TemplateGenerator.generatePresetBitmap(i)
            assertNotNull("Le preset $i ne doit pas retourner null", bitmap)
        }
    }

    @Test
    fun `templateGenerator default size is 1000x1000`() {
        val bitmap = TemplateGenerator.generatePresetBitmap(0)
        assertEquals(1000, bitmap.width)
        assertEquals(1000, bitmap.height)
    }

    @Test
    fun `templateGenerator uses first preset when index is out of bounds`() {
        val bitmap = TemplateGenerator.generatePresetBitmap(999)
        assertNotNull("Un index hors limites doit retourner le preset 0", bitmap)
    }

    @Test
    fun `templateGenerator returns correct number of presets`() {
        assertEquals("Il doit y avoir 10 presets", 10, TemplateGenerator.PRESETS.size)
    }

    @Test
    fun `templateGenerator cameroun preset exists`() {
        val camerounPreset = TemplateGenerator.PRESETS.find {
            it.name.contains("Cameroun", ignoreCase = true)
        }
        assertNotNull("Le preset Cameroun Green-Red doit exister", camerounPreset)
    }

    // ----------------------------------------------------------
    // MemeGeneratorUtil — createMeme
    // ----------------------------------------------------------

    @Test
    fun `createMeme returns bitmap with same dimensions as background`() {
        val background = TemplateGenerator.generatePresetBitmap(0, 800, 800)
        val result = MemeGeneratorUtil.createMeme(background, "TOP TEXT", "BOTTOM TEXT")

        assertEquals(800, result.width)
        assertEquals(800, result.height)
    }

    @Test
    fun `createMeme works with empty top text`() {
        val background = TemplateGenerator.generatePresetBitmap(0)
        val result = MemeGeneratorUtil.createMeme(background, "", "TEXTE DU BAS")
        assertNotNull(result)
    }

    @Test
    fun `createMeme works with empty bottom text`() {
        val background = TemplateGenerator.generatePresetBitmap(0)
        val result = MemeGeneratorUtil.createMeme(background, "TEXTE DU HAUT", "")
        assertNotNull(result)
    }

    @Test
    fun `createMeme works with both texts empty`() {
        val background = TemplateGenerator.generatePresetBitmap(0)
        val result = MemeGeneratorUtil.createMeme(background, "", "")
        assertNotNull(result)
    }

    @Test
    fun `createMeme handles long text without crash`() {
        val background = TemplateGenerator.generatePresetBitmap(0)
        val longText = "QUAND TU RÉALISES QUE TU AURAIS DÛ COMMENCER LE PROJET BIEN AVANT LA DEADLINE"
        val result = MemeGeneratorUtil.createMeme(background, longText, longText)
        assertNotNull(result)
        assertEquals(1000, result.width)
    }

    @Test
    fun `createMeme returns ARGB_8888 config`() {
        val background = TemplateGenerator.generatePresetBitmap(0)
        val result = MemeGeneratorUtil.createMeme(background, "TOP", "BOTTOM")
        assertEquals(Bitmap.Config.ARGB_8888, result.config)
    }

    // ----------------------------------------------------------
    // MemeGeneratorUtil — applyBitmapEdits (filtres)
    // ----------------------------------------------------------

    @Test
    fun `applyBitmapEdits grayscale does not crash`() {
        val base = TemplateGenerator.generatePresetBitmap(0)
        val result = MemeGeneratorUtil.applyBitmapEdits(base, 1.0f, 1.0f, "Grayscale")
        assertNotNull(result)
    }

    @Test
    fun `applyBitmapEdits sepia does not crash`() {
        val base = TemplateGenerator.generatePresetBitmap(1)
        val result = MemeGeneratorUtil.applyBitmapEdits(base, 1.0f, 1.0f, "Sepia")
        assertNotNull(result)
    }

    @Test
    fun `applyBitmapEdits invert does not crash`() {
        val base = TemplateGenerator.generatePresetBitmap(2)
        val result = MemeGeneratorUtil.applyBitmapEdits(base, 1.0f, 1.0f, "Invert")
        assertNotNull(result)
    }

    @Test
    fun `applyBitmapEdits with scribbles does not crash`() {
        val base = TemplateGenerator.generatePresetBitmap(0)
        val scribbles = listOf(0.1f to 0.1f, 0.5f to 0.5f, 0.9f to 0.9f)
        val result = MemeGeneratorUtil.applyBitmapEdits(
            base, 1.0f, 1.0f, "Original", scribbles
        )
        assertNotNull(result)
    }

    @Test
    fun `applyBitmapEdits preserves original dimensions`() {
        val base = TemplateGenerator.generatePresetBitmap(0, 512, 512)
        val result = MemeGeneratorUtil.applyBitmapEdits(base, 1.2f, 0.9f, "Neon Violet")
        assertEquals(512, result.width)
        assertEquals(512, result.height)
    }
}
