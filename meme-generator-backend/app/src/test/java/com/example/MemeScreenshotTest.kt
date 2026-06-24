package com.example

import android.app.Application
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.core.app.ApplicationProvider
import com.example.ui.MemeViewModel
import com.example.ui.screens.MemeAppUi
import com.example.ui.theme.MyApplicationTheme
import com.github.takahirom.roborazzi.RobolectricDeviceQualifiers
import com.github.takahirom.roborazzi.captureRoboImage
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * Tests de screenshot Roborazzi pour les 3 écrans principaux.
 *
 * Les images de référence sont générées dans :
 *   app/src/test/screenshots/
 *
 * Pour régénérer les références :
 *   ./gradlew recordRoborazziDebug
 *
 * Pour comparer avec les références existantes :
 *   ./gradlew verifyRoborazziDebug
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = RobolectricDeviceQualifiers.Pixel8, sdk = [34])
class MemeScreenshotTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    private fun buildViewModel(): MemeViewModel {
        val application = ApplicationProvider.getApplicationContext<Application>()
        return MemeViewModel(application)
    }

    // ----------------------------------------------------------
    // 1. Écran splash / onboarding
    // ----------------------------------------------------------
    @Test
    fun screenshot_splash_screen() {
        val viewModel = buildViewModel()

        composeTestRule.setContent {
            MyApplicationTheme {
                MemeAppUi(viewModel = viewModel)
            }
        }

        composeTestRule.onRoot()
            .captureRoboImage("src/test/screenshots/01_splash_screen.png")
    }

    // ----------------------------------------------------------
    // 2. Context Reader (onglet TEXT)
    // ----------------------------------------------------------
    @Test
    fun screenshot_context_reader_empty() {
        val viewModel = buildViewModel()
        viewModel.dismissSplash()   // Passer l'écran de démarrage
        viewModel.setTab("TEXT")

        composeTestRule.setContent {
            MyApplicationTheme {
                MemeAppUi(viewModel = viewModel)
            }
        }

        composeTestRule.onRoot()
            .captureRoboImage("src/test/screenshots/02_context_reader_empty.png")
    }

    @Test
    fun screenshot_context_reader_with_input() {
        val viewModel = buildViewModel()
        viewModel.dismissSplash()
        viewModel.setTab("TEXT")
        viewModel.setContextInput("Ma chérie dit qu'elle est en route mais on entend la douche")

        composeTestRule.setContent {
            MyApplicationTheme {
                MemeAppUi(viewModel = viewModel)
            }
        }

        composeTestRule.onRoot()
            .captureRoboImage("src/test/screenshots/03_context_reader_with_input.png")
    }

    // ----------------------------------------------------------
    // 3. Voice-to-Meme (onglet AUDIO)
    // ----------------------------------------------------------
    @Test
    fun screenshot_voice_to_meme_screen() {
        val viewModel = buildViewModel()
        viewModel.dismissSplash()
        viewModel.setTab("AUDIO")

        composeTestRule.setContent {
            MyApplicationTheme {
                MemeAppUi(viewModel = viewModel)
            }
        }

        composeTestRule.onRoot()
            .captureRoboImage("src/test/screenshots/04_voice_to_meme.png")
    }

    // ----------------------------------------------------------
    // 4. Status Remixer (onglet IMAGE)
    // ----------------------------------------------------------
    @Test
    fun screenshot_status_remixer_screen() {
        val viewModel = buildViewModel()
        viewModel.dismissSplash()
        viewModel.setTab("IMAGE")

        composeTestRule.setContent {
            MyApplicationTheme {
                MemeAppUi(viewModel = viewModel)
            }
        }

        composeTestRule.onRoot()
            .captureRoboImage("src/test/screenshots/05_status_remixer.png")
    }

    // ----------------------------------------------------------
    // 5. Galerie (onglet GALLERY)
    // ----------------------------------------------------------
    @Test
    fun screenshot_gallery_empty() {
        val viewModel = buildViewModel()
        viewModel.dismissSplash()
        viewModel.setTab("GALLERY")

        composeTestRule.setContent {
            MyApplicationTheme {
                MemeAppUi(viewModel = viewModel)
            }
        }

        composeTestRule.onRoot()
            .captureRoboImage("src/test/screenshots/06_gallery_empty.png")
    }

    // ----------------------------------------------------------
    // 6. Paramètres (onglet SETTINGS)
    // ----------------------------------------------------------
    @Test
    fun screenshot_settings_screen() {
        val viewModel = buildViewModel()
        viewModel.dismissSplash()
        viewModel.setTab("SETTINGS")

        composeTestRule.setContent {
            MyApplicationTheme {
                MemeAppUi(viewModel = viewModel)
            }
        }

        composeTestRule.onRoot()
            .captureRoboImage("src/test/screenshots/07_settings.png")
    }
}
