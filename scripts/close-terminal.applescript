on run argv
  if (count of argv) is 0 then return
  set rawTTY to item 1 of argv
  if rawTTY is "" then return

  -- Normalize TTY by extracting clean base name (e.g. ttys001)
  set cleanTTY to rawTTY
  if cleanTTY starts with "/dev/" then
    set cleanTTY to text 6 thru -1 of cleanTTY
  end if

  -- Give the shell a moment to finish its exit sequence
  delay 0.3

  -- Try Terminal.app first
  tell application "Terminal"
    repeat 5 times
      try
        repeat with terminalWindow in (every window)
          try
            repeat with terminalTab in (every tab of terminalWindow)
              try
                set tabTTY to (tty of terminalTab as text)
                set cleanTabTTY to tabTTY
                if cleanTabTTY starts with "/dev/" then
                  set cleanTabTTY to text 6 thru -1 of cleanTabTTY
                end if

                if cleanTabTTY is cleanTTY or tabTTY is rawTTY then
                  if (count of tabs of terminalWindow) is 1 then
                    close terminalWindow saving no
                  else
                    close terminalTab saving no
                  end if
                  return
                end if
              end try
            end repeat
          end try
        end repeat
      end try
      delay 0.3
    end repeat
  end tell

  -- Also try iTerm.app if it is running
  try
    tell application "System Events"
      set isITermRunning to (count of (every process whose name is "iTerm2" or name is "iTerm")) > 0
    end tell
    if isITermRunning then
      tell application "iTerm"
        repeat with itermWindow in windows
          try
            repeat with itermTab in tabs of itermWindow
              try
                repeat with itermSession in sessions of itermTab
                  try
                    set sessionTTY to (tty of itermSession as text)
                    set cleanSessionTTY to sessionTTY
                    if cleanSessionTTY starts with "/dev/" then
                      set cleanSessionTTY to text 6 thru -1 of cleanSessionTTY
                    end if

                    if cleanSessionTTY is cleanTTY or sessionTTY is rawTTY then
                      close itermSession
                      return
                    end if
                  end try
                end repeat
              end try
            end repeat
          end try
        end repeat
      end tell
    end if
  end try
end run

