$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = $PSScriptRoot
$slideDir = Join-Path $root 'slides'
[System.IO.Directory]::CreateDirectory($slideDir) | Out-Null

$C = @{
    Ink = '213B31'; Green = '226A53'; Ground = 'F4F7F4'; White = 'FFFFFF'
    Muted = '5E7165'; Line = 'D5DFD7'; Pale = 'E5F0E8'; Mint = 'B9D9BE'
    Blue = '355FB2'; BlueTint = 'E3EBFA'; Purple = '765094'; PurpleTint = 'EEE5F5'
    Rust = 'A45243'; RustTint = 'F6E5DF'; Gold = '86682D'; GoldTint = 'F2EBD9'
}
$font = 'Segoe UI'
$slides = [System.Collections.Generic.List[object]]::new()
$warnings = [System.Collections.Generic.List[object]]::new()
$ppt = $null
$deck = $null
$existingPowerPoint = @(Get-Process -Name POWERPNT -ErrorAction SilentlyContinue).Count -gt 0

function Get-Rgb([string]$hex) {
    return [Convert]::ToInt32($hex.Substring(0, 2), 16) +
        256 * [Convert]::ToInt32($hex.Substring(2, 2), 16) +
        65536 * [Convert]::ToInt32($hex.Substring(4, 2), 16)
}

function Add-Rect($slide, [double]$x, [double]$y, [double]$w, [double]$h,
    [string]$fill = $C.White, [string]$outline = '', [bool]$round = $false) {
    $kind = if ($round) { 5 } else { 1 }
    $shape = $slide.Shapes.AddShape($kind, $x, $y, $w, $h)
    $shape.Fill.Solid()
    $shape.Fill.ForeColor.RGB = Get-Rgb $fill
    if ($outline) {
        $shape.Line.ForeColor.RGB = Get-Rgb $outline
        $shape.Line.Weight = 0.7
    } else {
        $shape.Line.Visible = 0
    }
    if ($round) { $shape.Adjustments.Item(1) = 0.12 }
    return $shape
}

function Add-Line($slide, [double]$x1, [double]$y1, [double]$x2, [double]$y2,
    [string]$color = $C.Line, [double]$weight = 1) {
    $shape = $slide.Shapes.AddLine($x1, $y1, $x2, $y2)
    $shape.Line.ForeColor.RGB = Get-Rgb $color
    $shape.Line.Weight = $weight
    return $shape
}

function Add-Dot($slide, [double]$x, [double]$y, [double]$r, [string]$color) {
    $shape = $slide.Shapes.AddShape(9, $x - $r, $y - $r, $r * 2, $r * 2)
    $shape.Fill.Solid()
    $shape.Fill.ForeColor.RGB = Get-Rgb $color
    $shape.Line.Visible = 0
    return $shape
}

function Add-Text($slide, [double]$x, [double]$y, [double]$w, [double]$h,
    [string]$text, [double]$size = 20, [string]$color = $C.Ink,
    [bool]$bold = $false, [int]$align = 1) {
    $shape = $slide.Shapes.AddTextbox(1, $x, $y, $w, $h)
    $shape.TextFrame.MarginLeft = 0
    $shape.TextFrame.MarginRight = 0
    $shape.TextFrame.MarginTop = 0
    $shape.TextFrame.MarginBottom = 0
    $shape.TextFrame.WordWrap = -1
    $shape.TextFrame.AutoSize = 0
    $shape.TextFrame.VerticalAnchor = 1
    $range = $shape.TextFrame.TextRange
    $range.Text = $text
    $range.Font.Name = $font
    $range.Font.Size = $size
    $range.Font.Color.RGB = Get-Rgb $color
    $range.Font.Bold = if ($bold) { -1 } else { 0 }
    $range.ParagraphFormat.Alignment = $align
    $range.ParagraphFormat.SpaceAfter = 0
    $range.ParagraphFormat.SpaceBefore = 0
    # PowerPoint can resize a new, empty textbox while its frame defaults change.
    $shape.Left = $x
    $shape.Top = $y
    $shape.Width = $w
    $shape.Height = $h
    return $shape
}

function Add-Label($slide, [double]$x, [double]$y, [double]$w,
    [string]$text, [string]$fill = $C.Pale, [string]$color = $C.Green) {
    Add-Rect $slide $x $y $w 25 $fill '' $true | Out-Null
    Add-Text $slide ($x + 8) ($y + 5) ($w - 16) 16 $text 10.5 $color $true 2 | Out-Null
}

function Add-Footer($slide, [int]$index, [bool]$dark = $false) {
    $color = if ($dark) { 'B9D9BE' } else { $C.Muted }
    $rule = if ($dark) { '42604E' } else { $C.Line }
    Add-Line $slide 42 506 918 506 $rule 0.7 | Out-Null
    Add-Text $slide 42 517 330 14 'Songbird  /  Team kickoff  /  14 September 2026' 9.5 $color | Out-Null
    Add-Text $slide 866 516 52 15 ('{0:00}' -f $index) 10 $color $true 3 | Out-Null
}

function New-Slide([string]$title, [string]$subtitle = '', [bool]$dark = $false) {
    $slide = $deck.Slides.Add($deck.Slides.Count + 1, 12)
    $slide.FollowMasterBackground = 0
    $slide.Background.Fill.Solid()
    $slide.Background.Fill.ForeColor.RGB = Get-Rgb $(if ($dark) { $C.Ink } else { $C.Ground })
    if ($title) {
        Add-Text $slide 42 35 876 53 $title 32 $(if ($dark) { $C.White } else { $C.Ink }) $true | Out-Null
    }
    if ($subtitle) {
        Add-Text $slide 44 94 870 42 $subtitle 16 $(if ($dark) { $C.Mint } else { $C.Muted }) | Out-Null
    }
    Add-Footer $slide $slide.SlideIndex $dark
    return $slide
}

function Set-SpeakerNotes($slide, [string]$title, [string]$notes, [bool]$appendix = $false) {
    $slide.NotesPage.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text = $notes
    $slides.Add([pscustomobject]@{
        number = $slide.SlideIndex
        title = $title
        notes = $notes
        appendix = $appendix
        image = 'slides/{0:00}.png' -f $slide.SlideIndex
    })
}

function Add-Arrow($slide, [double]$x, [double]$y, [double]$w = 24, [string]$color = $C.Green) {
    Add-Line $slide $x $y ($x + $w) $y $color 1.5 | Out-Null
    Add-Line $slide ($x + $w - 6) ($y - 5) ($x + $w) $y $color 1.5 | Out-Null
    Add-Line $slide ($x + $w - 6) ($y + 5) ($x + $w) $y $color 1.5 | Out-Null
}

try {
    $ppt = New-Object -ComObject PowerPoint.Application
    $deck = $ppt.Presentations.Add(0)
    $deck.PageSetup.SlideWidth = 960
    $deck.PageSetup.SlideHeight = 540

    # 01 - Cover and enduring product vision.
    $s = New-Slide '' '' $true
    Add-Text $s 49 45 660 88 'Songbird' 62 $C.White $true | Out-Null
    Add-Text $s 50 169 590 142 "Build songs.`nLearn what makes them work." 40 $C.White $true | Out-Null
    Add-Text $s 53 350 548 66 "A practical songwriting platform.`nLearn the basic theory behind popular music." 22 $C.Mint | Out-Null
    Add-Label $s 53 450 205 'HARMONIZER-FIRST KICKOFF' '365446' 'D4E9D7'
    $motifColors = @('B9D9BE', '9BB5E2', 'C4A8DA', 'DCAEA0', 'DCC998')
    for ($v = 0; $v -lt 5; $v++) {
        $yy = 166 + $v * 48
        Add-Line $s 692 $yy 915 $yy '42604E' 1 | Out-Null
        for ($n = 0; $n -lt 4; $n++) {
            $offset = @(0, -10, 6, -3)[$n]
            Add-Rect $s (698 + $n * 55) ($yy - 8 + $offset) 42 13 $motifColors[$v] '' $true | Out-Null
        }
    }
    Add-Text $s 692 440 225 35 'One idea. More possibilities.' 14 $C.Mint $false 3 | Out-Null
    Set-SpeakerNotes $s 'Songbird: build songs, learn what makes them work' @'
Songbird is a platform for songwriters to build songs and learn the basic music theory they need for the majority of popular-music writing. The learning happens while making musical decisions, not as a prerequisite course.

The vision is broader than the first feature. Our initial build centers on the Harmonizer. A basic Chord Workshop is also part of the demo: it lets users set and audition the progression used by the Harmonizer. Chord discovery, song structures, contextual explanations, and guitar or piano voicings describe the wider tool vision.

We are not claiming that popular music is simple, that every song follows the same rules, or that one algorithm supplies the right answer. We help the writer hear alternatives, understand enough to choose, and retain authorship.

A short voice memo can be the starting point. Knowing the key, choosing chords, and setting a tempo are not prerequisites for bringing an idea to Songbird. The platform helps the songwriter work those things out while developing the song.

This seven-slide deck explains the product vision, one example journey, and the two connected tools. It describes the intended experience, not completed functionality.
'@

    # 02 - The purpose of the whole platform.
    $s = New-Slide 'Turn an idea into a song.' 'A platform for everyday songwriters - not just a harmony generator.'
    Add-Text $s 47 156 869 97 "Create music you can play or sing.`nLearn the basic theory behind the songs you write." 29 $C.Ink $true | Out-Null
    Add-Line $s 48 274 915 274 | Out-Null
    Add-Text $s 48 296 404 34 'Build the song' 24 $C.Green $true | Out-Null
    Add-Text $s 49 347 401 97 "Find chords for your melody.`nShape verses and choruses.`nAdd parts you can play or sing." 20 $C.Ink | Out-Null
    Add-Text $s 500 296 411 34 'Learn while writing' 24 $C.Green $true | Out-Null
    Add-Text $s 501 347 409 97 "Hear different musical choices.`nSee why notes and chords fit.`nKeep the sound that feels like you." 20 $C.Muted | Out-Null
    Add-Text $s 48 463 865 30 'Practical theory for popular songwriting - without needing to study it first.' 20 $C.Green $true | Out-Null
    Set-SpeakerNotes $s 'Songbird: the purpose of the platform' @'
Songbird helps everyday songwriters turn an unfinished musical idea into a song they can play or sing, while learning the basic music theory that makes those decisions easier.

The platform connects melody development, chord choices, simple verse and chorus structures, playable guitar or piano voicings, and vocal harmony. These are parts of the same song, not unrelated calculators. The harmonizer is the initial build priority within that larger vision.

Users do not need notation skills, a known key, an existing chord progression, or advanced theory vocabulary. They may start with a hummed tune, a voice memo, or chords they already like.

Learning is practical and tied to the user's music: hear alternatives, see why a choice can work, and keep or change it. We are helping people write popular music, not building a complex composition suite or requiring a theory course. The songwriter remains the author; Songbird does not promise to turn any clip into a finished recording automatically.
'@

    # 03 - The whole-platform journey, starting with a melody.
    $s = New-Slide 'From a hummed tune to a song.' 'A tune from the commute. A voice memo. A starting point for a whole song.'
    $steps = @(
        @('1', "Bring your`ntune", "Upload a voice memo`nor hum it here."),
        @('2', "Explore your`nmelody", "See editable notes.`nTry suggested keys."),
        @('3', "Build the`nbacking", "Try chords and`nverse / chorus ideas."),
        @('4', "Add harmony`nparts", "Explore vocal parts.`nHear the song grow."),
        @('5', "Make it`nyour song", "Play, rehearse, and`nrecord your song.")
    )
    for ($i = 0; $i -lt $steps.Count; $i++) {
        $x = 46 + $i * 177
        Add-Dot $s ($x + 19) 186 19 $C.Green | Out-Null
        Add-Text $s ($x + 2) 173 34 27 $steps[$i][0] 19 $C.White $true 2 | Out-Null
        if ($i -lt 4) { Add-Arrow $s ($x + 49) 185 98 $C.Line }
        Add-Text $s $x 228 165 58 $steps[$i][1] 23 $C.Ink $true | Out-Null
        Add-Text $s $x 300 169 69 $steps[$i][2] 17 $C.Muted | Out-Null
    }
    Add-Label $s 400 381 161 'CHORD WORKSHOP'
    Add-Label $s 577 381 161 'HARMONIZER'
    Add-Rect $s 45 443 872 44 $C.Pale '' $true | Out-Null
    Add-Text $s 62 452 838 30 'Key, tempo, and chords are choices along the way - not entry requirements.' 20 $C.Green $true 2 | Out-Null
    Set-SpeakerNotes $s 'The platform journey: start with the tune' @'
Imagine a tune coming to mind on the commute. Capture it when it is safe to do so, then bring that voice memo to Songbird later. Recording directly into Songbird is another starting point.

The user does not have to supply a key, chords, or tempo before importing the idea. Songbird turns the melody into editable notes and helps them explore possible musical contexts. A short melody may fit several keys and progressions, so present candidates to audition rather than claim there is one uniquely correct key.

The Chord Workshop helps build the backing: try chords against the melody, find guitar or piano voicings, and develop verse and chorus ideas. The Harmonizer then helps explore additional vocal parts. Tempo, timing, key, and chord choices become shared song context as the user works; they are not an upfront form that blocks capture.

This is one possible journey, not a required wizard. Someone who already has chords, knows the key, or only wants a harmony can enter with that context. The tools share choices without requiring the user to re-enter them.

The destination is a song the user develops and performs, not an automatically finished song generated from a hum. The songwriter still chooses the direction, writes any lyrics, and makes the final recording.
'@

    # 04 - The Harmonizer tool, not a second whole-platform journey.
    $s = New-Slide 'Harmonizer: add voices around your melody.' 'One lead melody in. Up to four added harmony lines to hear, edit, and sing.'
    Add-Label $s 46 145 171 'PRIMARY BUILD TARGET'
    Add-Text $s 48 205 236 34 'Your melody' 23 $C.Ink $true | Out-Null
    Add-Rect $s 48 251 234 75 $C.Pale '' $true | Out-Null
    Add-Line $s 61 291 268 291 $C.Line | Out-Null
    for ($n = 0; $n -lt 4; $n++) {
        Add-Rect $s (62 + $n * 50) (278 + @(4, -6, 7, 0)[$n]) 36 12 $C.Green '' $true | Out-Null
    }
    Add-Text $s 49 345 237 65 "Uses the chords and key`nchosen for your song." 17 $C.Muted | Out-Null
    Add-Arrow $s 294 286 29
    Add-Rect $s 337 193 284 238 $C.White $C.Line $true | Out-Null
    Add-Text $s 353 210 250 34 'Add 1-4 harmony lines' 21 $C.Ink $true | Out-Null
    $partColors = @($C.Blue, $C.Purple, $C.Rust, $C.Gold)
    $partTints = @($C.BlueTint, $C.PurpleTint, $C.RustTint, $C.GoldTint)
    for ($v = 0; $v -lt 4; $v++) {
        $yy = 265 + $v * 36
        Add-Text $s 354 ($yy - 3) 77 23 ('Part {0}' -f ($v + 1)) 13 $partColors[$v] $true | Out-Null
        Add-Line $s 435 ($yy + 8) 604 ($yy + 8) $C.Line | Out-Null
        for ($n = 0; $n -lt 4; $n++) {
            Add-Rect $s (438 + $n * 41) ($yy + @(0, -5, 4, -2)[$n]) 31 10 $partTints[$v] $partColors[$v] $true | Out-Null
        }
    }
    Add-Text $s 659 202 258 34 'Hear the result' 22 $C.Ink $true | Out-Null
    Add-Text $s 660 245 256 61 "Piano playback with backing`nchords. Solo any part." 17 $C.Muted | Out-Null
    Add-Text $s 659 331 258 34 'Make it yours' 22 $C.Ink $true | Out-Null
    Add-Text $s 660 374 256 54 "Choose range, mode, and style.`nMove notes to fit your song." 16.5 $C.Muted | Out-Null
    Add-Rect $s 45 449 872 40 $C.Pale '' $true | Out-Null
    Add-Text $s 62 458 838 28 'Rehearse a line. Export MIDI or a piano guide for your own recording.' 19 $C.Green $true 2 | Out-Null
    Set-SpeakerNotes $s 'Harmonizer: what the tool does' @'
The Harmonizer is the main initial build target. Its specific job is to suggest additional singable parts around an existing lead, not to replace the lead or write the entire song.

It uses the captured or imported melody plus the key, timing, and chord choices developed in the song. Those choices may come from the Chord Workshop or from information the user already knows; they are not prerequisites for uploading the first voice memo.

The target is one to four ADDED harmony lines: up to five total voices including the original lead. The first arrangements share the lead's rhythm. Users can choose musical context, voice ranges, and arrangement preferences, then move notes to find a sound they want. The original lead and protected edits should remain intact.

Audition the parts with piano playback and backing chords. Solo and rehearse a line, slow it down when useful, and export separate MIDI parts or piano-guide WAV files for recording. These are guides, not synthesized sung vocals. The songwriter performs the final vocal.
'@

    # 05 - Editable, simplified workspace illustration.
    $s = New-Slide 'Harmonizer: hear and shape each part.' 'Conceptual layout for discussion. The notes below are illustrative, not generated output.'
    Add-Rect $s 45 151 872 282 $C.White $C.Line $true | Out-Null
    Add-Rect $s 46 152 870 37 $C.Pale '' $true | Out-Null
    Add-Text $s 60 160 91 22 'Songbird' 16 $C.Green $true | Out-Null
    Add-Text $s 177 162 514 22 'Play   /   Loop     96 BPM     D Dorian     Guide: Piano' 12 $C.Ink $true | Out-Null
    Add-Text $s 767 162 132 22 'Learn my part' 12 $C.Green $true 3 | Out-Null
    Add-Line $s 179 190 179 432 | Out-Null
    Add-Line $s 732 190 732 432 | Out-Null
    $voiceColors = @($C.Green, $C.Blue, $C.Purple, $C.Rust, $C.Gold)
    $voiceTints = @($C.Pale, $C.BlueTint, $C.PurpleTint, $C.RustTint, $C.GoldTint)
    $voiceNames = @('Original lead', 'Harmony 1', 'Harmony 2', 'Harmony 3', 'Harmony 4')
    for ($v = 0; $v -lt 5; $v++) {
        $yy = 232 + $v * 36
        Add-Dot $s 62 ($yy + 8) 3 $voiceColors[$v] | Out-Null
        Add-Text $s 71 $yy 101 23 $voiceNames[$v] 12 $voiceColors[$v] $true | Out-Null
        Add-Text $s 77 ($yy + 18) 79 16 'Mute   Solo' 8.5 $C.Muted | Out-Null
    }
    Add-Text $s 194 200 508 21 'Dm                   G                    Am                   Dm' 13 $C.Ink $true | Out-Null
    for ($row = 0; $row -le 11; $row++) {
        Add-Line $s 191 (230 + $row * 16) 721 (230 + $row * 16) $C.Line 0.55 | Out-Null
    }
    for ($col = 0; $col -le 16; $col++) {
        Add-Line $s (192 + $col * 33) 230 (192 + $col * 33) 420 $C.Line 0.55 | Out-Null
    }
    $noteOffsets = @(@(31, 47, 47, 31, 15, 31, 47, 31), @(0, 15, 15, 0, 0, 15, 15, 0), @(79, 79, 63, 79, 63, 79, 79, 79), @(111, 127, 111, 111, 111, 127, 111, 111), @(159, 159, 175, 159, 159, 175, 159, 159))
    for ($v = 0; $v -lt 5; $v++) {
        for ($n = 0; $n -lt 8; $n++) {
            Add-Rect $s (198 + $n * 65) (236 + $noteOffsets[$v][$n]) 48 10 $voiceTints[$v] $voiceColors[$v] $true | Out-Null
        }
    }
    Add-Text $s 747 202 153 24 'Added parts' 13 $C.Ink $true | Out-Null
    for ($i = 1; $i -le 4; $i++) {
        $x = 747 + ($i - 1) * 39
        Add-Rect $s $x 231 31 26 $(if ($i -eq 4) { $C.Green } else { $C.Ground }) '' $true | Out-Null
        Add-Text $s $x 235 31 19 ([string]$i) 12 $(if ($i -eq 4) { $C.White } else { $C.Ink }) $true 2 | Out-Null
    }
    Add-Text $s 747 275 155 44 "Style: Close`nRange: per voice" 12 $C.Muted | Out-Null
    Add-Text $s 747 337 155 39 "Keep edited notes`nLead stays unchanged" 10.5 $C.Green $true | Out-Null
    Add-Rect $s 747 389 152 27 $C.Green '' $true | Out-Null
    Add-Text $s 751 395 144 18 'Regenerate parts' 10.5 $C.White $true 2 | Out-Null
    Add-Text $s 48 455 263 31 'Five separate voices' 20 $C.Ink $true | Out-Null
    Add-Text $s 351 455 267 31 'Notes you can change' 20 $C.Ink $true | Out-Null
    Add-Text $s 653 455 264 31 'A path to rehearsal' 20 $C.Ink $true | Out-Null
    Set-SpeakerNotes $s 'Harmonizer workspace concept' @'
This is a simplified, fully editable PowerPoint diagram of the intended workspace. It is not a screenshot of a finished product and the note blocks are illustrative.

The original lead and four added harmonies are separate voices. A piano roll is the first editor, not an engraved score. The original melody remains distinct and is not overwritten when harmonies are regenerated.

Per-part controls should make it easy to isolate and learn a line. Harmony controls include the number of added parts, an arrangement preference, and a comfortable range for each voice. Editing and locking a note should preserve the writer's decisions.

The actual initial UI concept already exists as an SVG-based clickable mockup under the earlier name Second Voice. Songbird is the current working name. That mockup demonstrates interactions and example playback, not vocal transcription or automatic harmony generation.

The small UI labels are intentionally illustrative; the three statements below the diagram are the meeting's key takeaways.
'@

    # 06 - Chord choices, explanations, structures, and voicings in one tool.
    $s = New-Slide 'Chord Workshop: build around your melody.' 'Choose chords and song sections, explore voicings, and learn why the choices work.'
    Add-Label $s 46 145 163 'THE TOOL VISION'
    Add-Text $s 47 196 291 37 'Find chords to try.' 25 $C.Ink $true | Out-Null
    Add-Text $s 48 238 283 43 "Melody lands on E?`nTry C or Am beneath it." 17 $C.Muted | Out-Null
    Add-Text $s 48 286 283 23 'Both chords contain E.' 16 $C.Green $true | Out-Null
    Add-Text $s 47 326 291 38 'Shape the song.' 25 $C.Ink $true | Out-Null
    Add-Text $s 48 374 295 48 "Try different progressions`nfor verse and chorus." 17 $C.Muted | Out-Null
    Add-Rect $s 365 146 551 54 $C.White $C.Line $true | Out-Null
    Add-Text $s 383 156 515 36 'VERSE    C  Am  F  G       CHORUS    F  G  C  C' 14 $C.Ink $true | Out-Null
    Add-Rect $s 365 218 265 205 $C.White $C.Line $true | Out-Null
    Add-Rect $s 646 218 270 205 $C.White $C.Line $true | Out-Null
    Add-Text $s 382 230 231 29 'Guitar / C' 19 $C.Green $true | Out-Null
    Add-Text $s 664 230 232 29 'Piano / C' 19 $C.Green $true | Out-Null
    $gx = 421; $gy = 285; $gw = 154; $gh = 96
    for ($i = 0; $i -lt 6; $i++) {
        Add-Line $s ($gx + $i * $gw / 5) $gy ($gx + $i * $gw / 5) ($gy + $gh) $C.Muted 0.8 | Out-Null
    }
    for ($i = 0; $i -le 4; $i++) {
        Add-Line $s $gx ($gy + $i * $gh / 4) ($gx + $gw) ($gy + $i * $gh / 4) $C.Muted $(if ($i -eq 0) { 3 } else { 0.8 }) | Out-Null
    }
    foreach ($entry in @(@(0, 'x'), @(3, 'o'), @(5, 'o'))) {
        Add-Text $s ($gx + $entry[0] * $gw / 5 - 7) 263 16 19 $entry[1] 13 $C.Muted $false 2 | Out-Null
    }
    Add-Dot $s ($gx + $gw / 5) ($gy + 60) 6 $C.Green | Out-Null
    Add-Dot $s ($gx + 2 * $gw / 5) ($gy + 36) 6 $C.Green | Out-Null
    Add-Dot $s ($gx + 4 * $gw / 5) ($gy + 12) 6 $C.Green | Out-Null
    Add-Text $s 384 393 229 20 'Open shape / x32010' 12 $C.Muted $false 2 | Out-Null
    $px = 672; $py = 281; $keyW = 26
    for ($i = 0; $i -lt 8; $i++) {
        $selected = @(0, 2, 4) -contains $i
        Add-Rect $s ($px + $i * $keyW) $py $keyW 88 $(if ($selected) { $C.Pale } else { $C.White }) $C.Muted | Out-Null
        if ($selected) {
            Add-Text $s ($px + $i * $keyW) ($py + 62) $keyW 21 @('C', 'D', 'E', 'F', 'G', 'A', 'B', 'C')[$i] 12 $C.Green $true 2 | Out-Null
        }
    }
    foreach ($key in @(0, 1, 3, 4, 5)) {
        Add-Rect $s ($px + ($key + 1) * $keyW - 8) $py 16 49 $C.Ink | Out-Null
    }
    Add-Text $s 663 384 237 32 'C-E-G or E-G-C: same chord, different voicing.' 12.5 $C.Muted $false 2 | Out-Null
    Add-Text $s 47 453 868 32 'Choose a chord, hear it with your melody, and see how to play it.' 21 $C.Green $true | Out-Null
    Set-SpeakerNotes $s 'Chord Workshop: the connected tool vision' @'
The Chord Workshop is one tool for building the song around a melody: choose chords, understand why they can fit, arrange simple song sections, and explore ways to play those chords on guitar or piano. The learning example is part of choosing a chord, not a separate theory tool.

For example, the user's melody lands on E. C major contains C, E, and G; A minor contains A, C, and E. Both contain E, so both are worth auditioning beneath that note. The explanation belongs next to those chord choices, when the user wants it. One note does not determine the key or guarantee that either chord suits the entire phrase.

Users can begin with their own chords, a starting progression, or eventually melody-aware suggestions. They can compare how the backing changes the melody, explore repetition and contrast between verse and chorus, and change the voicing without changing the chord itself.

The example progression is illustrative. The selected C chord is shown as the standard open guitar shape x32010 and the piano voicing C-E-G. E-G-C is another inversion of the same chord. Strings run low E to high E from left to right in the guitar diagram.

The next slide narrows this wider vision to the basic working tool needed for the demo. Rich chord discovery, section-building assistance, and extensive voicing options are not all prerequisites for that demo. The Harmonizer remains the primary build target.
'@

    # 07 - The required basic chord editor and its Harmonizer connection.
    $s = New-Slide 'Chord Workshop: the demo minimum.' 'Set a progression, hear it, and use it in the Harmonizer.'
    Add-Label $s 46 145 195 'BASIC TOOL / DEMO TARGET'
    Add-Rect $s 45 187 567 202 $C.White $C.Line $true | Out-Null
    Add-Text $s 63 201 273 25 'Your progression' 18 $C.Ink $true | Out-Null
    Add-Text $s 402 205 192 21 'Example: 96 BPM / 4/4' 12 $C.Muted $false 3 | Out-Null
    $demoChords = @('C', 'Am', 'F', 'G')
    for ($i = 0; $i -lt $demoChords.Count; $i++) {
        $x = 64 + $i * 134
        Add-Text $s $x 236 120 18 ('BAR {0}' -f ($i + 1)) 10.5 $C.Muted $true | Out-Null
        Add-Rect $s $x 258 120 71 $C.Pale $C.Line $true | Out-Null
        Add-Text $s ($x + 12) 262 96 36 $demoChords[$i] 27 $C.Green $true | Out-Null
        Add-Text $s ($x + 13) 307 94 18 '1 bar' 12 $C.Muted | Out-Null
    }
    Add-Text $s 63 350 433 24 'Start from your chords or a preset.' 16 $C.Muted | Out-Null
    Add-Rect $s 517 345 78 29 $C.Green '' $true | Out-Null
    Add-Text $s 521 351 70 18 '+ Chord' 11 $C.White $true 2 | Out-Null
    Add-Arrow $s 628 286 43
    Add-Rect $s 688 211 229 157 $C.Pale '' $true | Out-Null
    Add-Text $s 705 229 196 34 'Harmonizer' 23 $C.Ink $true | Out-Null
    Add-Text $s 706 276 195 67 "Uses the chord names`nand their timing under`nthe melody." 16 $C.Muted | Out-Null
    Add-Text $s 689 379 228 23 'Same song. No re-entry.' 14 $C.Green $true 2 | Out-Null
    $basics = @(
        @('Edit chords + timing', "Add, change, reorder, remove.`nSet a length for each chord."),
        @('Audition with piano', "Hear chords with the melody.`nLoop the phrase while choosing."),
        @('Use it for harmonies', "Share the progression directly.`nKeep control of regeneration.")
    )
    for ($i = 0; $i -lt $basics.Count; $i++) {
        $x = 48 + $i * 301
        Add-Text $s $x 423 267 30 $basics[$i][0] 20 $C.Ink $true | Out-Null
        Add-Text $s ($x + 1) 459 265 35 $basics[$i][1] 14 $C.Muted | Out-Null
    }
    Set-SpeakerNotes $s 'Chord Workshop: minimum working demo' @'
Yes, a basic working Chord Workshop belongs in the demo. It is the place to supply and audition the progression that the Harmonizer uses, rather than a static chord chart or a second full-scale project.

The minimum is a timed chord editor: add, change, reorder, and remove chord blocks; set each chord's duration; and play the progression with the melody using piano. The example uses one chord per bar in 4/4 at 96 BPM, but a list of chord names alone is not enough. Harmony generation needs to know when each chord applies.

The editor, playback, and Harmonizer use the same progression and timing. The user should not have to copy chords between tools. After a progression changes, let the user regenerate affected harmonies deliberately while preserving the lead and protected edits.

Manual chord entry is optional. Someone who knows their chords can enter them; someone who does not can audition and edit a clearly labeled starter preset. A preset is a starting point, not a claim that the app inferred the right progression from the melody.

This does not restore setup-first capture. Users can bring in a voice memo without knowing the key, chords, or tempo. Establish a working tempo and align the melody while arranging so the selected chord blocks and melody share a timeline. For this chord-aware demo path, use a progression the user has chosen or accepted before generating against it.

More sophisticated melody-aware chord suggestions, verse/chorus assistance, and larger guitar/piano voicing libraries can follow. The first demo needs the small working editor and a reliable connection to the Harmonizer, not all of that depth at once.
'@

    # Ask the installed PowerPoint renderer to measure and export the actual slides.
    foreach ($slide in $deck.Slides) {
        foreach ($shape in $slide.Shapes) {
            if ($shape.Left -lt -1 -or $shape.Top -lt -1 -or ($shape.Left + $shape.Width) -gt 961 -or ($shape.Top + $shape.Height) -gt 541) {
                $warnings.Add([pscustomobject]@{ slide = $slide.SlideIndex; issue = 'shape-outside-slide'; shape = $shape.Name })
            }
            if ($shape.HasTextFrame -eq -1 -and $shape.TextFrame.HasText -eq -1) {
                $boundH = $shape.TextFrame2.TextRange.BoundHeight
                $boundW = $shape.TextFrame2.TextRange.BoundWidth
                if ($boundH -gt ($shape.Height + 2) -or $boundW -gt ($shape.Width + 2)) {
                    $warnings.Add([pscustomobject]@{
                        slide = $slide.SlideIndex; issue = 'text-overflow'; text = $shape.TextFrame.TextRange.Text
                        actualHeight = [Math]::Round($boundH, 1); boxHeight = $shape.Height
                        actualWidth = [Math]::Round($boundW, 1); boxWidth = $shape.Width
                    })
                }
            }
        }
    }
    $pptxPath = Join-Path $root 'Songbird-Team-Kickoff.pptx'
    $pdfPath = Join-Path $root 'Songbird-Team-Kickoff.pdf'
    $deck.SaveAs($pptxPath, 24)
    $slides | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $root 'slides.json') -Encoding utf8
    ConvertTo-Json -InputObject @($warnings.ToArray()) -Depth 5 | Set-Content -LiteralPath (Join-Path $root 'layout-report.json') -Encoding utf8
    $deck.SaveAs($pdfPath, 32)
    foreach ($slide in $deck.Slides) {
        $slide.Export((Join-Path $slideDir ('{0:00}.png' -f $slide.SlideIndex)), 'PNG', 1600, 900)
    }
    Write-Output "POWERPOINT=$pptxPath"
    Write-Output "PDF=$pdfPath"
    Write-Output "SLIDES=$($slides.Count)"
    Write-Output "LAYOUT_WARNINGS=$($warnings.Count)"
    if ($warnings.Count) { $warnings | ConvertTo-Json -Depth 5 | Write-Output }
} finally {
    if ($null -ne $deck) {
        $deck.Close()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($deck) | Out-Null
    }
    if ($null -ne $ppt) {
        if (-not $existingPowerPoint -and $ppt.Presentations.Count -eq 0) { $ppt.Quit() }
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
