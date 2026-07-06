' Fix https://atrovia.vercel.app/signup 404 — push signup.html to GitHub Next.js repo
Option Explicit
Dim sh, fso, log, psCmd, txt, ts
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
log = "C:\Users\Administrator\atrovia_signup_fix_output.txt"

psCmd = "powershell -NoProfile -ExecutionPolicy Bypass -File ""C:\Users\Administrator\Atrovia.co-site\scripts\fix-signup-404.ps1"""
sh.Run psCmd, 1, True

If fso.FileExists(log) Then
    Set ts = fso.OpenTextFile(log, 1)
    txt = ts.ReadAll
    ts.Close
    If InStr(txt, "git push exit code: 0") > 0 Then
        MsgBox "Signup fix pushed to GitHub!" & vbCrLf & vbCrLf & "Wait 1-2 minutes, then test:" & vbCrLf & "https://atrovia.vercel.app/signup", vbInformation, "Atrovia Signup Fix"
    Else
        MsgBox "Fix script finished — check log for errors:" & vbCrLf & log, vbExclamation, "Atrovia Signup Fix"
    End If
Else
    MsgBox "Script did not run. Open PowerShell and run:" & vbCrLf & psCmd, vbCritical, "Atrovia Signup Fix"
End If