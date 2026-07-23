on run argv
  set targetTTY to item 1 of argv

  -- Let Ghosttyle.command finish first to avoid Terminal's running-process prompt.
  delay 0.2

  tell application "Terminal"
    repeat with terminalWindow in windows
      repeat with terminalTab in tabs of terminalWindow
        if (tty of terminalTab as text) is targetTTY then
          if (count of tabs of terminalWindow) is 1 then
            close terminalWindow
          else
            close terminalTab
          end if
          return
        end if
      end repeat
    end repeat
  end tell
end run
