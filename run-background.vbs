Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)

' 1. Start Backend silently in background (0 = hidden window)
WshShell.Run "cmd /c cd /d """ & strPath & "\backend"" && npm run dev", 0, False

' 2. Wait 4 seconds for backend database and routes to boot
WScript.Sleep 4000

' 3. Start Frontend silently in background
WshShell.Run "cmd /c cd /d """ & strPath & "\frontend"" && npm run dev", 0, False

' 4. Wait 2 seconds and launch browser
WScript.Sleep 2000
WshShell.Run "http://localhost:5173"

