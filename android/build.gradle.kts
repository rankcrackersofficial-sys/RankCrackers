buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools:r8:8.3.37") // 🔱 Fix for ClassCastException in JDK 21+
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
    project.extra.set("kotlin_version", "2.2.20")
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}

subprojects {
    afterEvaluate {
        if (project.hasProperty("android")) {
            val android = project.extensions.getByName("android")
            if (project.name == "isar_flutter_libs") {
                // Using reflection to set namespace if the method exists
                try {
                    val setNamespace = android.javaClass.getMethod("setNamespace", String::class.java)
                    setNamespace.invoke(android, "dev.isar.isar_flutter_libs")
                } catch (e: Exception) {
                    // Fallback or ignore
                }
            }
        }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
