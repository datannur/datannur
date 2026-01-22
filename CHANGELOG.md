# datannur

## unreleased

- add: folder type field
- remove: jquery-powertip and use custom tooltip instead

## 0.16.1 (2025-01-17)

- add: initial data template files for jsonjsdb, static-make, and update-app
- add: alternative db for testing
- change: delivery format to just "format" in ui
- fix: jsonjsdb with minimal data
- fix: HTTP server compatibility with Windows network drives (SMB shares)
- fix: remove z-index from frequency value styles
- remove: md extension from LICENSE file

## 0.16.0 (2025-12-14)

- add: LLM tab navigation
- change: split countEntities and listEntities llm tools
- fix: json reading with utf8 encoding in python scripts
- fix: main scrollbar postion with chatPanel open
- fix: conditionally set app width to prevent fixed pixel width during static HTML generation
- fix: link to new variable id for freq demo data
- refactor: remove datasetVariables tab and use variables tab instead
- refactor: migrate to datannur organization

## 0.15.2 (2025-12-07)

- add: LLM chat web version (php) with turnstile captcha
- fix: warning with state_referenced_locally
- fix: search bar initial position on homepage
- refactor: validate_schemas.py and start_app.py and put json template in own dir
- refactor: make demo data more complete
- refactor: extract in module and component the different parts of LLMChatPanel
- remove: LLM vscode extension

## 0.15.1 (2025-11-30)

- add: customizable system prompts, junction tables for many-to-many relations, and date context to extension
- add: LLM chat directly in the app
- refactor: extension with test and better prompt

## 0.15.0 (2025-11-06)

- add: jsonjsdb manage both json and json.js files depending on environment
- add: json schema, openapi and redoc
- add: api rest in php and nodejs
- add: dcat-ap-ch export script
- add: vscode extension with LLM chat participant for natural language database interaction

## 0.14.1 (2025-10-29)

- add: tags hierarchy with color to better visualize tag relationships
- add: source maps of the app
- add: dataset information display in VariableInfo component
- change: improve sorting logic for tag children in TagsListLevel component
- refactor: consolidate app initialization logic and improve static rendering handling
- refactor: externalize to svelte-fileapp for all URL and routing related code

## 0.14.0 (2025-10-15)

- change: use svg-sprite for brand icons
- change: logo handling for light and dark modes in Header, Loading components and main-banner
- fix: stat addNumeric() `item[attribut.variable]` must be true not just type of string
- fix: evolution col variable with `<br>`
- fix: evolution variable two rows and null value
- refactor: enforce strict typescript rules everywhere

## 0.13.0 (2025-10-02)

- add: whenAppReady instead of db.loaded and refactor db.use and db.preview
- add: escapeHtml on all datatables columns render to prevent XSS
- fix: JsonjsdbBuilder.watchDb path
- refactor: db to use only Jsonjsdb methods and props, use type instead of interface for entities
- refactor: enforce camelCase for all attributes and use kebab-case for scss

## 0.12.10 (2025-09-26)

- add: DOMPurify for HTML sanitization
- fix: folder markdown about_page to about-page
- fix: demo image path in README
- fix: search bar height debonce with no result
- fix: clean up head elements before mounting app
- refactor: replace app_version meta tag with `__APP_VERSION__` constant
- refactor: enforce PascalCase for class names and camelCase for methods, functions variables and properties
- refactor: enforce prefer-const, no-unused-vars, no-undef and no-explicit-any elint rules
- refactor: enforce noImplicitThis and strictFunctionTypes ts rules
- refactor: avoid svelte class name from variable name
- refactor: enhance log handling and HTML rendering in stats components
- remove: loader on search page

## 0.12.9 (2025-09-23)

- add: community standards docs (code of conduct, security, issue templates, pr templates)
- add: code quality check on ci
- add: prettier check and format all code with it
- change: rename all ts files, image and folder to be in kebab-case
- change: json config files use camelCase instead of snake_case
- fix: fix eslint path, ci ignore path and contributing.md
- refactor: fix basic errors for eslint, ts and svelte and add type for entities
- remove: reset-branch.ts script and use git cleanup alias instead
- remove: release.ts script and use version change detection in release.yml instead

## 0.12.8 (2025-09-18)

- add: eslint and change prettier config and start apply new coding style to root, test and public ts files
- add: build process before ui tests and catch console error in ui tests
- add: CONTRIBUTING.md file and adapt readme contributing section
- add: test.yml for ci
- add: ci/cd badge to readme
- add: reset-branch script to delete merged branch
- change: update_app.py to always use emojis
- change: ugrade to jsonjsdb-builder with correct naming convention
- change: jsonjsdb refactor with standard naming convention
- change: rename workflow files and make one badge for deploy status and one for github pages
- change: use only one root readme for users and contributing.md for developers
- fix: copilot-instructions.md location
- remove: eslint on .json.js files

## 0.12.7 (2025-09-12)

- add: deployment configuration and script for server deployment
- change: migrate static_make from Puppeteer to Playwright
- change: migrate live_browser test from Puppeteer to Playwright
- change: refactor node scripts in public folder
- change: refactor public/readme
- fix: update main entry point to TypeScript and correct release script filename
- fix: standardize formatting with `: ` in CHANGELOG.md
- fix: update_app.py to correctly remove existing jsonjsdb_config div using regex
- fix: missing dependencie in write-excel-file used by jsonjsdb_editor

## 0.12.6 (2025-09-11)

- add: filterType "select" to column meta_localisation
- add: doc for data integration
- change: increase update_app.py compatibility to python 3.8+
- change: internalize alias for institution
- fix: datetime and wrap_long_text function with optional param null
- fix: test Time import path alias
- remove: optional db_key param in default config jsonjsdb_config.html

## 0.12.5 (2025-09-09)

- add: proxy_url config option and no python dependencies in public readme
- change: readme link to download app and refactor contributing section
- change: update_app.py use emojis only if terminal support it
- change: updgrade Datatables version and fix related typescript error
- change: convert static_make.js to typescript
- change: update_app.json with static_make ts and no more python version
- remove: static_make python version

## 0.12.4 (2025-09-07)

- change: improve update_app.py script
- change: refactor get_config() and use some early return in update_app.py
- change: refactor vite.config.ts
- remove: gitignore and gitattributes from public folder
- remove: svelte.config.js and move its content to vite.config.js

## 0.12.3 (2025-09-06)

- fix: release url
- fix: release process to avoid warning multiple tag for same commit
- remove: datannur-app repo with the built app and adapt readme accordingly

## 0.12.2 (2025-09-05)

- change: rename js folder to lib
- change: jsonjs db data default to non compact mode
- change: use github action to manage release and app build version
- fix: github linguist stat to exclude json.js files

## 0.12.1 (2025-09-04)

- change: add space around separator in tab filtered column
- change: improve readme documentation
- change: move github action (for github pages) to root
- change: jsonjsdb use `__table__.json.js` instead of `__meta_.json.js`
- change: move update_app.json to data folder
- change: configure project to work with typescript
- change: use absolute path for main.scss import
- change: convert all svelte and js files to ts files
- fix: search bar transition z-index and left position
- fix: page transition and search bar state management
- fix: flash footer in header on page load with static rendering
- fix: PercentBar border-radius for small percent
- fix: vscode import of node_modules lib types

## 0.12.0 (2025-08-26)

- change: evolution summary option default value to false
- change: use Button component with press effect
- change: switch to MIT license
- fix: evolution summary switch position on mobile
- fix: dt-buttons z-index on mobile
- fix: adjust padding of search bar and search bar close btn

## 0.11.1 (2025-08-21)

- add: freq tab and column for variables with visual frequency distribution
- add: search bar transition between homepage and other page
- change: put search bar on the middle on homepage
- change: keep value in search bar when switching pages and keep search bar on mobile homepage
- fix: allow dataset without folder
- fix: documentation mermaid relationship freq to value removed as incorrect

## 0.11.0 (2025-07-14)

- add: git release and tag for source code repo
- change: use rounded percent bar
- fix: evolution add_validities with table not found
- fix: tabs_helper get_nb_stat() with items not found
- fix: static_make.js wait before server ready

## 0.10.11 (2025-07-07)

- add: variable modality on dataset_variables
- add: column id for tag table
- change: icon for tag id to use internal_id icon
- change: copy id on click on info page
- change: make text extendable faster
- fix: typo in schema
- fix: column date last and next update sort icon position
- fix: search bar with dash

## 0.10.10 (2025-06-14)

- add: data lineage nb source and nb derived
- add: description for data lineage on page functionality
- add: items from child tags to parent tags
- add: switch show tree on tag item page

## 0.10.9 (2025-05-22)

- add: institution valididy start and end date
- add: doc tab column inherited to distinct if the doc is inherited from a child element
- add: data lineage at the variable level and infered for the dataset level
- change: use present time in change log and commit message
- change: use start and end date for validity instead of period for institution, folder and dataset
- change: make timestamp column sortable and filterable by using format YYYY/MM/DD HH:mm instead of DD/MM/YYYY HH:mm:ss

## 0.10.8 (2025-05-15)

- add: metadata only in schema but not in data
- add: evolution screenshot and description in page fonctionnality
- change: make db_schema an internal file
- change: clean up db_schema and remove pdf and use_pdf db fields

## 0.10.7 (2025-05-08)

- add: modality link color on hover for variable table and info
- add: value link color on hover
- add: variable is key info
- change: on dataset variables, dont show columns dataset, folder and institution
- change: upgrade to datatables 2.3
- fix: catch error without crash for wrong start or end date format

## 0.10.6 (2025-04-30)

- fix: evolution get_folder_id with null value and doc last_update
- fix: evolution diff from emptpy value show NaN
- change: update to flexsearch 0.8 and load it as external script

## 0.10.5 (2025-02-09)

- add: evolution summary switch to toggle evolution mode
- add: evolution summary filter main entity
- add: evolution summary filter simple filter mode
- change: icon "partie de" use entity color
- change: evolution update date use futur and past color for variable icon
- change: put tab title on two rows
- change: make tab title percent use entity color
- fix: jsonjsdv_editor evolution dont stringify null value

## 0.10.4 (2025-01-26)

- add: evolution diff date format YYYY, YYYYtQ and YYYY/MM
- add: link color entity for dataset name
- add: include linked evolution to tag page
- change: doc tab in the correct order for institution and folder
- fix: hide evolution where element not found, likely due to dataset type filter
- fix: evolution filter allow no error if empty
- fix: error page default element value and add doc case
- fix: add_history modality value split parent id and name on last separator occurrence
- fix: jsonjsdb_editor dont update main file if no change

## 0.10.3 (2025-01-21)

- add: icon and title for page internal view
- add: recursive child element to evolution tab
- add: entity color on links hover or active
- add: evolution diff for number and date relative
- change: rename history to evolution
- change: make jsonjsdb_editor use xlsx state for evolution
- change: doc last update date use Column.timestamp()
- fix: favorite page about tab image caption
- fix: little typo in the license

## 0.10.2 (2025-01-18)

- add: parent entity to history on entity page
- add: markdown link title attribute to open internal link in new tab
- add: percent color past and futur for column last_update and next_update
- add: border bottom to datatable header
- change: history green and red background color more visible
- change: history last and next update with different type in select input
- change: make tabs more compact et colored
- fix: sort column moment by numeric value
- fix: jsonjsdb_editor prevent adding entry when old and new value are both null or empty

## 0.10.1 (2025-01-11)

- add: history tab to all pages
- add: no_more_update attribute to hide next_update_date
- add: nb total item in stat tab
- change: upgrade puppeteer to version 24.0
- fix: history next update based on frequency lowercase
- fix: validity date with quarter notation
- fix: internal link changing param but same page

## 0.10.0 (2025-01-09)

- add: column nb variable for institutions and folders
- add: processing of history changes in jsonjsdb_editor
- add: basic history tab on homepage
- add: history diff with highlight of delete and add on row and value
- add: history parent entity column
- add: history validity start, end and update date and next_update_date estimation
- fix: markdown image with alt not_rounded
- fix: entity column select input search with clean name
- refactor: set default datatable sort_by_name to false and remove unnecessary check for empty datatable
- remove: unused option page export and import tabs

## 0.9.7 (2024-12-19)

- add: markdown image caption
- add: some screenshots for about page
- change: updated all screenshots
- change: updated main presentation text
- change: updated text for organisation and fonctionality tab, also renamed "vue méta" to "vue interne"
- fix: github linguist stats with correct gitattributes

## 0.9.6 (2024-12-05)

- change: improve md doc preview container alignment
- change: improve main page text content
- change: move more in front and consolidate column date and time ago
- change: add main title on about page tab
- change: put favorite column at the beginning of the table
- fix: datasets and variables order based on dataset type
- fix: search result icon reactivity and highlight only start of word
- fix: md doc preview max width 100%
- fix: md content content padding on mobile
- refactor: remove suffix \_info from all info files
- refactor: remove some unused export in util.js

## 0.9.5 (2024-11-26)

- add: stat popup shown from table column tooltip btn
- add: tooltip description for all columns
- add: metadataset relations in datasetInfo
- change: description info with correct padding and width on mobile
- change: use arrow icon for metaDataset relations
- change: upgrade to vite 6

## 0.9.4 (2024-11-12)

- add: table column filter info popup
- change: table download filename use page and tab name
- change: align attribute name and value on page entity info on mobile
- fix: dropdown header menu stick after click
- fix: markdown ol padding
- fix: extendable on one line
- fix: tag page opposite tags tab
- fix: header fav btn on mobile
- fix: dont show btn filter info popup when no filter

## 0.9.3 (2024-11-07)

- add: tag doc in md files
- add: ckeckDb accecc to db object via global window
- add: dark mode nice transition with view transition on switch
- change: make about and stat tab overflow on full page
- change: doc md preview no padding
- fix: git language stats with correct gitattributes
- fix: extendable fixed width and break word
- fix: nb_values width during loading because value infered from list
- fix: sort by dataset nb line as numeric even if empty value
- fix: replace css :not() with opposite class name because of warning in latest svelte
- fix: no cursor pointer on dataset preview
- fix: favorite number display on mobile

## 0.9.2 (2024-11-02)

- add: tag doc
- add: table input filter ="" and !"" for empty and not empty
- add: md to json.js conversion
- change: header favorite btn without name and scrollbar min width larger
- change: dont use indexdb encryption by default
- change: harmonize variable naming in search_history indexdb data
- change: make datatables column width not reduce width when no result
- change: refactor datatable js code to extract js code in separate files
- fix: ellipsis on extendable tree on entity info page
- fix: git language stats in app (build) repo to include assets md, js and css files

## 0.9.1 (2024-10-29)

- add: doc description
- add: filter infobox visible on mobile
- change: center vertically datatables rows content
- change: migrate all svelte code to version 5
- fix: tabs body overflow hidden when not datatables
- fix: extendable text in tab info default 2 lines visible
- fix: scroll bar page body during tab transition
- fix: nb doc max for percent bar in datatable
- remove: default bulma css

## 0.9.0 (2024-10-23)

- change: use specific icon for preview
- change: use two rows for datatables and make column fixed width
- fix: remove stat tab menu border on dark mode
- fix: remove mouse cursor when datatables not clickable
- fix: tab nb item update from child component with store
- fix: move worker logic in js file
- fix: page option btn icon margin

## 0.8.17 (2024-10-20)

- add: more console log duration during init process
- add: special error page for when error during init process
- add: deep level info on entity page
- change: put footer inside menu in mobile version
- change: migrate to svelte 5 with minimal changes
- change: put deep level and favorite at the end of the table
- change: use always absolute deep level and nevel relative for column level
- fix: tabs_body overflow hidden only when not datatables, so download button is still visible
- fix: add old variable name only to variable name in search module
- fix: keep footer in menu for mobile version
- fix: force input on metaDataset datetime column

## 0.8.16 (2024-10-17)

- add: some screenshot for about page
- change: get last modification timestamp directly from jsonjsdb instead of info file
- change: get filter and alias info from config file instead of filter and alias files
- change: upgrade to sass 1.80.1
- change: put icons in icon folder
- change: use replaceAll instead of replace when needed (not regex)
- change: about fonctionality now use new screen shot all light and dark mode
- fix: typo in about_meta
- fix: doc preview a pixel to height
- fix: tabs_body overflow hidden without hidding the download button
- fix: jsonjsdb dont update last modification when no change

## 0.8.15 (2024-10-16)

- add: metaDataset last_update info
- add: footer last update info live updated
- add: about functionality tab
- change: make datatables not stretch to 100% width and remove header border
- change: use **meta_schema** instead of other meta files
- change: complete **meta_schema** variable and remove virtual table
- change: center option tab section
- change: make tab body max height dynamic and always apply
- fix: update jsonjsdb with little fix for empty ids
- fix: jsonjsdb types not imported
- remove: jsonjsdb metaDataset virtual table for many to many relation

## 0.8.14 (2024-10-11)

- add: jsonjsdb can normalize db schema
- change: use tab for about page
- change: rename preview file and md file, move md jsonjs in db
- change: use md doc from db based on doc id
- change: markdown many to many relation entity order from main to secondary
- change: denormalize db schema to remove many to many relation table
- fix: footer vue meta highlight on metavariable page
- fix: entity icon in title centered on mobile when no favorite
- fix: vue meta variable nb value link and value preview
- remove: readme folder attribut, icon and color

## 0.8.13 (2024-10-07)

- add: about tab for search page
- change: click on header logo from homepage make tab change to default tab
- change: adapt switch "show all recursive" to fit aside and be always present when needed
- fix: update to latest datatables version after bug fixed with fixedcolumns 5.0.3
- fix: table select input with null option changed to empty string
- fix: adapt test to new page url with more realistic data

## 0.8.12 (2024-10-03)

- add: demo dataset with lot of variable to test datatables scroller
- fix: revert datatables to version 2.1.4 to fix bug with fixed col and scroller
- fix: upgrade sass without warning about new JS API
- fix: loading logo centered
- fix: remove errors when dataset has no folder or institution
- change: dont make static page for variable and modality
- change: make demo data more realistic and complete
- refactor: use Column.nb_child_recursive() and Column.nb_variable()

## 0.8.11 (2024-09-26)

- add: link to release on github when clicking on app version in footer
- add: github links to the source code in footer
- change: remove some config files and integrate them in package.json and vite.config.js
- change: remove pdf version of the license in the root and move it in public/assets
- fix: enable again shortcut that open link in new tab and fix go back to homepage
- fix: error 404 page link to homepage

## 0.8.10 (2024-09-23)

- add: support mermaid in all markdown about tab
- change: refactor mermaid loading
- change: improve about tab for all pages
- change: make image in about tab full width
- fix: add line break between about main body and more info
- fix: make main_banner src dynamic in Main.svelte

## 0.8.9 (2024-09-18)

- change: mermaid version from 9.3 to 11.2 (latest)
- change: migrate scss @import to @use
- change: make about_main internal markdown with optional custom parts
- change: move main_banner in assets folder
- fix: typo in License with the licensor name
- fix: overlap between exporter btn, search bar and open_all btn on mobile

## 0.8.8 (2024-09-16)

- add: modality description in table modalities
- change: use internal markdown files instead of config.xlsx for about tab
- fix: search highlight html entities with empty search
- fix: search bar debounce sync highlight and result
- fix: search bar remove recent search btn
- fix: search bar colspan diff with recent search

## 0.8.7 (2024-09-15)

- add: License in pdf format
- change: use navigo router lib instead of page.js
- change: Improve readme formulation and links
- change: License now in first stable version

## 0.8.6 (2024-09-04)

- add: app/readme to the file to update
- add: dataset delivery_format
- fix: tab title initial width too large on static page
- fix: typo in about page
- fix: tag level on tab tag page dataset

## 0.8.5 (2024-08-28)

- add: changelog file
- add: update_app.json with param to choose version
- add: app readme
- change: db_source/config.xlsx section about_main
- change: markdown link highlight
