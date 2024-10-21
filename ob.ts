import fs from "fs"
import path from "path"
import JavaScriptObfuscator from 'javascript-obfuscator';

const walkBuiltJsSync = (dir: string, filelist: string[] = []) => {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file)
        if (fs.statSync(filePath).isDirectory()) {
            filelist = walkBuiltJsSync(filePath, filelist)
        } else {
            if (new RegExp(/\.js$/).test(filePath)) {
                filelist.push(filePath)
            }
        }
    })
    return filelist
}

async function obfuscateAll(filePaths: string[]): Promise<void[]> {
    const allJobs = filePaths.map(async filePath => {
        const code = await new Promise<string>((resolve, reject) => {
            fs.readFile(filePath, {
                encoding: "utf8",
            }, (err, code) => {
                if (err) {
                    reject(err)
                }
                resolve(code)
            })
        }) 
        new Promise((resolve, reject) => {
            const obfuscationResult = JavaScriptObfuscator.obfuscate(
                code,
                {
                    compact: true,
                    controlFlowFlattening: true,
                    controlFlowFlatteningThreshold: 1,
                    numbersToExpressions: true,
                    simplify: true,
                    stringArrayShuffle: true,
                    splitStrings: true,
                    stringArrayThreshold: 1,
                    stringArray: true
                }
            );
            fs.writeFile(filePath, obfuscationResult.getObfuscatedCode(), (err) => {
                if (err) {
                    reject(err)
                }
                resolve(filePath)
            })
        })
    })

    return Promise.all(allJobs)
}

async function run() {
    if (!fs.existsSync("build")) {
        console.error("No build folder found")
        process.exit(1)
    }
    const filePaths = walkBuiltJsSync("build")
    console.log("Obfuscating", filePaths.length, "files")
    try {
        await obfuscateAll(filePaths)
    } catch (err) {
        console.error("Error obfuscating", err)
        process.exit(1)
    }
    console.log("Done")
}

run()
