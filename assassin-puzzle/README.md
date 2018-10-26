# Assassin Puzzle Demo

Work in progress...

# Setup for running on a local machine

Intall prerequisites

```
npm install   # or yarn install
npm install gulp@3.9.1
gulp watch    # demo live updates when code changes
```

Then open `index.html` in a web browser.

```
open index.html
```

## Files

`geometry.js` contains the main geometric primitives that are unrelated to
rendering. The coordinate system for these classes is standard Cartesian
(0,0)-in-the-center coordinates.

`main.js` instantiates the geometry objects, renders them with d3, and sets up
the relevant behaviors.
