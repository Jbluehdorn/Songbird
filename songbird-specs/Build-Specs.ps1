$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = $PSScriptRoot
$preview = Join-Path $root 'preview'
[System.IO.Directory]::CreateDirectory($preview) | Out-Null
$documents = @(
    @{ File = 'shell.md'; Page = 'shell.html'; Label = 'Shell'; Title = 'Shell and shared song contract' },
    @{ File = 'chord-finder.md'; Page = 'chord-finder.html'; Label = 'Chord Finder'; Title = 'Chord Finder' },
    @{ File = 'harmonizer.md'; Page = 'harmonizer.html'; Label = 'Harmonizer'; Title = 'Harmonizer' }
)

foreach ($document in $documents) {
    $rendered = ConvertFrom-Markdown -Path (Join-Path $root $document.File)
    $body = $rendered.Html
    # Markdig strips some heading prefixes; use GitHub-style anchors for the source links.
    $anchorCounts = @{}
    foreach ($heading in [regex]::Matches($body, '<h([1-6]) id="[^"]*">(.*?)</h\1>')) {
        $level = $heading.Groups[1].Value
        $headingHtml = $heading.Groups[2].Value
        $plainHeading = [System.Net.WebUtility]::HtmlDecode([regex]::Replace($headingHtml, '<[^>]*>', ''))
        $anchor = ($plainHeading.ToLowerInvariant() -replace '[^\p{L}\p{N}_ -]', '').Trim() -replace '\s', '-'
        $baseAnchor = $anchor
        if ($anchorCounts.ContainsKey($baseAnchor)) {
            $anchorCounts[$baseAnchor]++
            $anchor += '-' + $anchorCounts[$baseAnchor]
        } else {
            $anchorCounts[$baseAnchor] = 0
        }
        $body = $body.Replace($heading.Value, ('<h' + $level + ' id="' + $anchor + '">' + $headingHtml + '</h' + $level + '>'))
    }
    foreach ($target in $documents) {
        $body = $body.Replace(('href="' + $target.File), ('href="' + $target.Page))
    }
    $toc = foreach ($heading in [regex]::Matches($body, '<h2 id="([^"]+)">(.*?)</h2>')) {
        '<li><a href="#' + $heading.Groups[1].Value + '">' + $heading.Groups[2].Value + '</a></li>'
    }
    $body = $body.Replace('<table>', '<div class="table-scroll" role="region" aria-label="Specification table" tabindex="0"><table>')
    $body = $body.Replace('</table>', '</table></div>')
    $navigation = foreach ($target in $documents) {
        $current = if ($target.File -eq $document.File) { ' aria-current="page"' } else { '' }
        '<a href="' + $target.Page + '"' + $current + '>' + $target.Label + '</a>'
    }
    $title = [System.Net.WebUtility]::HtmlEncode($document.Title)
    $html = @"
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>$title - Songbird specifications</title>
  <style>
    * { box-sizing: border-box; }
    html { scroll-padding-top: 24px; }
    body { margin: 0; color: #213b31; background: #f4f7f4; font: 16px/1.65 "Segoe UI", Arial, sans-serif; }
    a { color: #226a53; text-underline-offset: 3px; }
    a:hover { color: #164d3b; }
    :focus-visible { outline: 3px solid #226a53; outline-offset: 4px; }
    .skip { position: absolute; top: -80px; left: 16px; padding: 8px 16px; background: #fff; z-index: 1; }
    .skip:focus { top: 12px; }
    header { padding: 18px 28px; border-bottom: 1px solid #d5dfd7; background: #fff; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .brand { color: #213b31; font-size: 19px; font-weight: 700; text-decoration: none; }
    .downloads { display: flex; gap: 18px; flex-wrap: wrap; font-size: 14px; }
    .layout { max-width: 1320px; margin: 0 auto; display: grid; grid-template-columns: 224px minmax(0, 1fr); gap: 40px; padding: 32px 28px 72px; }
    aside { align-self: start; position: sticky; top: 24px; max-height: calc(100vh - 48px); overflow-y: auto; padding: 0 6px 12px 0; font-size: 14px; }
    .documents { display: flex; flex-direction: column; gap: 4px; }
    .documents a { padding: 8px 10px; border-radius: 4px; text-decoration: none; }
    .documents a:hover { background: #e5f0e8; }
    .documents [aria-current="page"] { background: #226a53; color: #fff; font-weight: 600; }
    aside h2 { margin: 26px 10px 10px; font-size: 14px; }
    aside ol { padding: 0 10px; margin: 0; list-style: none; }
    aside li { margin: 0 0 10px; }
    aside li a { color: #405a49; }
    main { min-width: 0; padding: 28px 36px 40px; background: #fff; border: 1px solid #d5dfd7; }
    main h1 { margin: 0 0 20px; font-size: 30px; line-height: 1.25; letter-spacing: -.025em; text-wrap: balance; }
    main h2 { margin: 44px 0 16px; font-size: 23px; line-height: 1.35; }
    main h3 { margin: 30px 0 12px; font-size: 18px; line-height: 1.4; }
    main p, main ul, main ol { max-width: 72ch; }
    main p { margin: 0 0 16px; }
    main li { margin-bottom: 9px; }
    main code { font: .9em/1.5 Consolas, "Courier New", monospace; overflow-wrap: anywhere; }
    main pre { max-width: 100%; padding: 18px; background: #f4f7f4; border: 1px solid #d5dfd7; overflow: auto; }
    main pre code { overflow-wrap: normal; }
    .table-scroll { max-width: 100%; overflow-x: auto; margin: 18px 0 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.55; }
    th, td { padding: 10px 12px; text-align: left; vertical-align: top; border: 1px solid #d5dfd7; }
    th { background: #e5f0e8; font-weight: 600; }
    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; gap: 20px; padding: 20px 16px 40px; }
      aside { position: static; max-height: none; padding: 0; }
      .documents { flex-direction: row; flex-wrap: wrap; gap: 8px; }
      aside .page-nav { display: none; }
      main { padding: 24px; }
    }
    @media (max-width: 540px) {
      header { padding: 16px; }
      main { padding: 22px 16px; }
      main h1 { font-size: 26px; }
      main h2 { font-size: 21px; }
      th, td { padding: 8px; min-width: 110px; }
    }
    @media print {
      body { background: #fff; color: #000; font-size: 11pt; }
      header, aside, .skip { display: none; }
      .layout { display: block; max-width: none; padding: 0; }
      main { border: 0; padding: 0; }
      main h2, main h3 { break-after: avoid; }
      tr, pre { break-inside: avoid; }
      .table-scroll { overflow: visible; }
      a { color: inherit; }
    }
  </style>
</head>
<body>
  <a class="skip" href="#content">Skip to specification</a>
  <header>
    <a class="brand" href="shell.html">Songbird / Specifications</a>
    <div class="downloads">
      <a href="$($document.File)" download>Download this Markdown file</a>
      <a href="Songbird-Specifications.zip" download>Download all three specs</a>
    </div>
  </header>
  <div class="layout">
    <aside>
      <nav class="documents" aria-label="Specifications">$($navigation -join "`n")</nav>
      <nav class="page-nav" aria-label="On this page">
        <h2>On this page</h2>
        <ol>$($toc -join "`n")</ol>
      </nav>
    </aside>
    <main id="content">
$body
    </main>
  </div>
</body>
</html>
"@
    [System.IO.File]::WriteAllText((Join-Path $preview $document.Page), $html, [System.Text.UTF8Encoding]::new($false))
}

$sourcePaths = @($documents | ForEach-Object { Join-Path $root $_.File })
Compress-Archive -LiteralPath $sourcePaths -DestinationPath (Join-Path $root 'Songbird-Specifications.zip') -Force
Write-Output 'Rendered three linked specifications and packaged the Markdown sources.'
