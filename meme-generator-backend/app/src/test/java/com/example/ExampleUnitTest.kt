package com.example

import org.junit.Test
import java.io.File
import java.util.Stack

class ExampleUnitTest {
  @Test
  fun checkBraces() {
    val file = File("src/main/java/com/example/ui/screens/MemeAppUi.kt")
    if (!file.exists()) {
        println("File not found! Trying absolute path...")
        return
    }
    
    val lines = file.readLines()
    val stack = Stack<Pair<Int, String>>() // Line number, and context of the open brace
    
    for ((index, line) in lines.withIndex()) {
        val lineNum = index + 1
        
        // Skip comments and string literals for simpler parsing
        var inString = false
        var escaped = false
        
        var i = 0
        while (i < line.length) {
            val char = line[i]
            
            if (escaped) {
                escaped = false
                i++
                continue
            }
            
            if (char == '\\') {
                escaped = true
                i++
                continue
            }
            
            if (char == '"') {
                inString = !inString
                i++
                continue
            }
            
            if (!inString) {
                // Check for single-line comment
                if (char == '/' && i + 1 < line.length && line[i + 1] == '/') {
                    break // Ignore the rest of the line
                }
                
                if (char == '{') {
                    stack.push(Pair(lineNum, line.trim()))
                } else if (char == '}') {
                    if (stack.isEmpty()) {
                        println("ERROR: Unmatched closing brace '}' at line $lineNum: ${line.trim()}")
                    } else {
                        stack.pop()
                    }
                }
            }
            i++
        }
    }
    
    if (stack.isNotEmpty()) {
        println("ERROR: The following braces were opened but never closed:")
        while (stack.isNotEmpty()) {
            val (lineNum, context) = stack.pop()
            println("Line $lineNum: $context")
        }
    } else {
        println("SUCCESS: All braces are perfectly matched!")
    }
  }
}
