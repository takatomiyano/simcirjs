#SimcirJS

This SimcirJS is modified and extended program,
based on the original code by Kazuhiko Arase.
Some improvements made by a GitHub user nodai2hITC are also imported.

Copyright (c) 2014 Kazuhiko Arase
Copyright (c) 2026 Takatomi Yano

Licensed under the MIT license:
  http://www.opensource.org/licenses/mit-license.php

-- Third-party libraries

qrcode.js (qrcode-generator)
  Copyright (c) 2009 Kazuhiko Arase
  URL: https://github.com/kazuhikoarase/qrcode-generator
  Licensed under the MIT license:
    http://www.opensource.org/licenses/mit-license.php

lz-string.min.js (lz-string v1.5.0)
  Copyright (c) 2013 pieroxy
  URL: https://github.com/pieroxy/lz-string
  Licensed under the MIT license:
    http://www.opensource.org/licenses/mit-license.php
  Used to compress circuit data before embedding it in the URL hash,
  significantly reducing QR code size.


====Original README.txt from here====

SimcirJS

Copyright (c) 2014 Kazuhiko Arase

URL: http://www.d-project.com/

Licensed under the MIT license:
  http://www.opensource.org/licenses/mit-license.php


-- System Requirements

Web browser that supports HTML5

-- Contents

README.txt           -- this file
simcir.js            -- Simcir core javascript (required)
simcir.css           -- Simcir core stylesheet (required)
simcir-basicset.js   -- Simcir basicset javascript (optional)
simcir-basicset.css  -- Simcir basicset stylesheet (optional)
simcir-library.js    -- Simcir library javascript
                        (optional, requires basicset)
sample.html          -- sample of live circuit
blank.html           -- blank template
get_and_set.html     -- sample that get and set a circuit directly
                        with jQuery

====Original README.txt to here====
