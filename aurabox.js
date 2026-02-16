// ==UserScript==
// @name         AuraBox
// @namespace    http://tampermonkey.net/
// @version      vAlpha.2.8
// @description  Theming Agent for SchoolBox
// @author       Cyclate
// @match        https://link.stleonards.vic.edu.au/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
    "use strict";

    const VERSION = "vAlpha.2.8";

    // --- CONFIGURATION & STATE ---

    // Default theme - will be overridden by saved theme
    let theme = {
        transparency: "5f",
    };

    theme = {
        // Background Image URL$
        transparency: theme.transparency,
        blur_amount: 10,

        backgroundImage: "https://i.postimg.cc/WzccJ6cR/new-4.png",
        background: "#0b0f14" + theme.transparency,
        background_light: "#1a2029" + theme.transparency,
        background_lighter: "#2a313d" + theme.transparency,
        surface: "#12161c" + theme.transparency,
        border: "#0b0f14",
        text: "#d0d6e0",
        secondaryText: "#a0a6b0",
        heading: "#f0f4f8",
        accent: "#82b3e8",
        tableBg: "#12171d" + theme.transparency,
        tableHeader: "#1a2029" + theme.transparency,
        inputBg: "#1c222b",
        inputDisabled: "#12171d",
        selectionBg: "#3a7fc4" + theme.transparency,
        selectionText: "#e6ecf2",
        scroll_track: "#1f242c",
        scroll_thumb: "#3b404c",
        scroll_thumb_hover: "#424754",
        scroll_thumb_active: "#494e5c",
        scroll_corner: "#181d24",
    };

    let gradeTheme = [
        "#82b3e8",
        "#5c91c0",
        "#3a6d99",
        "#325f87",
        "#2a5175",
        "#234463",
        "#1c3651",
        "#151f2f",
    ];

    // Global Style Element
    const styleElement = document.createElement("style");

    // --- COLOR MATH FUNCTIONS ---

    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b),
            min = Math.min(r, g, b);
        let h,
            s,
            l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        return [h * 360, s, l];
    }

    function hslToHex(h, s, l) {
        l /= 100;
        const a = (s * Math.min(l, 1 - l)) / 100;
        const f = (n) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color)
                .toString(16)
                .padStart(2, "0");
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    // --- SETTINGS UI ---

    function openSettingsModal() {
        if (document.getElementById("aurabox-settings-overlay")) return;

        const overlay = document.createElement("div");
        overlay.id = "aurabox-settings-overlay";
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); z-index: 10001;
            display: flex; justify-content: center; align-items: center;
            backdrop-filter: blur(5px);
        `;

        const box = document.createElement("div");
        box.style.cssText = `
            background: ${theme.surface};
            border: 1px solid ${theme.accent};
            padding: 25px;
            border-radius: 10px;
            width: 600px;
            max-width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            color: ${theme.text};
            font-family: sans-serif;
        `;

        const formatArray = (arr) => arr.join(", ");

        box.innerHTML = `
            <h2 style="margin-top:0; color:${theme.heading}; border-bottom: 1px solid ${theme.border}; padding-bottom: 10px;">AuraBox Settings</h2>
            <div style="margin-bottom: 20px;">
                <label style="display:block; font-weight:bold; margin-bottom: 5px; color:${theme.heading};">Background Image URL:</label>
                <input type="text" id="aurabox-bg-input" value="${theme.backgroundImage}"
                    style="width: 100%; padding: 10px; background: ${theme.inputBg}; color: ${theme.heading}; border: 1px solid ${theme.border}; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display:block; font-weight:bold; margin-bottom: 5px; color:${theme.heading};">Grade Gradient Theme (Comma separated hex):</label>
                <textarea id="aurabox-grades-input" rows="2"
                    style="width: 100%; padding: 10px; background: ${theme.inputBg}; color: ${theme.secondaryText}; border: 1px solid ${theme.border}; border-radius: 4px; font-family: monospace; font-size: 0.8em;">${formatArray(gradeTheme)}</textarea>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
                <button id="aurabox-close-btn" style="padding: 8px 15px; background: transparent; border: 1px solid ${theme.secondaryText}; color: ${theme.secondaryText}; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button id="aurabox-save-btn" style="padding: 8px 20px; background: ${theme.accent}; border: none; color: ${theme.background}; font-weight: bold; border-radius: 4px; cursor: pointer;">Save & Reload</button>
            </div>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        document.getElementById("aurabox-close-btn").onclick = () =>
            overlay.remove();

        document.getElementById("aurabox-save-btn").onclick = () => {
            const bgInput = document
                .getElementById("aurabox-bg-input")
                .value.trim();
            const gradesInput = document
                .getElementById("aurabox-grades-input")
                .value.trim();

            if (bgInput) {
                theme.backgroundImage = bgInput;
                try {
                    gradeTheme = gradesInput
                        .split(",")
                        .map((c) => c.trim())
                        .filter((c) => c.startsWith("#"));

                    saveTheme();
                    showNotification("Settings Saved. Reloading...");
                    setTimeout(() => window.location.reload(), 500);
                } catch (e) {
                    showNotification(
                        "Error parsing theme. Check format.",
                        true,
                    );
                }
            } else {
                showNotification("URL cannot be empty", true);
            }
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
    }

    // --- EXPORT / IMPORT LOGIC ---

    function exportThemeFromImage() {
        showNotification("Analyzing background image...", false);

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = theme.backgroundImage;

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = 100;
                canvas.height = 100 * (img.height / img.width);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const data = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                ).data;
                let r = 0,
                    g = 0,
                    b = 0,
                    count = 0;

                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] > 128) {
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                }

                if (count === 0) {
                    throw new Error("Image appears empty or transparent");
                }

                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);

                const [h, s, l] = rgbToHsl(r, g, b);
                const bgSat = Math.min(s * 100, 30);
                const accSat = Math.max(s * 100, 60);

                const newTheme = {
                    backgroundImage: theme.backgroundImage,
                    background: hslToHex(h, bgSat * 0.6, 7),
                    background_light: hslToHex(h, bgSat * 0.6, 12),
                    background_lighter: hslToHex(h, bgSat * 0.5, 18),
                    surface: hslToHex(h, bgSat * 0.6, 9),
                    border: hslToHex(h, bgSat * 0.6, 7),
                    text: hslToHex(h, 10, 90),
                    secondaryText: hslToHex(h, 10, 70),
                    heading: hslToHex(h, 20, 96),
                    accent: hslToHex(h, accSat, 65),
                    tableBg: hslToHex(h, bgSat * 0.6, 10),
                    tableHeader: hslToHex(h, bgSat * 0.6, 14),
                    inputBg: hslToHex(h, bgSat * 0.5, 13),
                    inputDisabled: hslToHex(h, bgSat * 0.5, 8),
                    selectionBg: hslToHex(h, accSat, 40),
                    selectionText: "#ffffff",
                    scroll_track: hslToHex(h, bgSat * 0.3, 10),
                    scroll_thumb: hslToHex(h, bgSat * 0.3, 25),
                    scroll_thumb_hover: hslToHex(h, bgSat * 0.3, 35),
                    scroll_thumb_active: hslToHex(h, bgSat * 0.3, 45),
                    scroll_corner: hslToHex(h, bgSat * 0.3, 10),
                };

                const newGradeTheme = [];
                for (let i = 0; i < 8; i++) {
                    const stepL = 60 - i * 5;
                    const stepS = accSat - i * 5;
                    newGradeTheme.push(
                        hslToHex(h, Math.max(stepS, 20), Math.max(stepL, 15)),
                    );
                }

                const themeExport = {
                    theme: newTheme,
                    gradeTheme: newGradeTheme,
                    version: VERSION,
                    source: "Auto-generated from background",
                    exportDate: new Date().toISOString(),
                };

                const dataStr = JSON.stringify(themeExport, null, 2);
                const dataUri =
                    "data:application/json;charset=utf-8," +
                    encodeURIComponent(dataStr);
                const exportFileDefaultName = `AuraBox-generated-theme-${new Date().toISOString().split("T")[0]}.json`;

                const linkElement = document.createElement("a");
                linkElement.setAttribute("href", dataUri);
                linkElement.setAttribute("download", exportFileDefaultName);
                linkElement.click();

                showNotification(
                    "Theme generated and downloaded! (Not applied)",
                    false,
                );
            } catch (e) {
                console.error(e);
                showNotification(
                    "Could not read image data (CORS restriction likely).",
                    true,
                );
            }
        };

        img.onerror = () => {
            showNotification("Failed to load image URL.", true);
        };
    }

    function loadSavedTheme() {
        const savedTheme = GM_getValue("AuraBoxTheme", null);
        if (savedTheme) {
            theme = { ...theme, ...savedTheme.theme };
            gradeTheme = savedTheme.gradeTheme || gradeTheme;
        }
    }

    function saveTheme() {
        const theme = {
            theme: theme,
            gradeTheme: gradeTheme,
            timestamp: new Date().toISOString(),
        };
        GM_setValue("AuraBoxTheme", theme);
    }

    function exportTheme() {
        const theme = {
            theme: theme,
            gradeTheme: gradeTheme,
            version: VERSION,
            exportDate: new Date().toISOString(),
        };

        const dataStr = JSON.stringify(theme, null, 2);
        const dataUri =
            "data:application/json;charset=utf-8," +
            encodeURIComponent(dataStr);
        const exportFileDefaultName = `AuraBox-theme-${new Date().toISOString().split("T")[0]}.json`;

        const linkElement = document.createElement("a");
        linkElement.setAttribute("href", dataUri);
        linkElement.setAttribute("download", exportFileDefaultName);
        linkElement.click();
    }

    function importTheme() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const theme = JSON.parse(e.target.result);
                    if (theme.theme && typeof theme.theme === "object") {
                        theme = { ...theme, ...theme.theme };
                        gradeTheme = theme.gradeTheme || gradeTheme;

                        saveTheme();
                        applyTheme();
                        showNotification("Theme imported successfully!");
                    } else {
                        showNotification("Invalid theme file format", true);
                    }
                } catch (error) {
                    showNotification("Error parsing theme file", true);
                    console.error("Theme import error:", error);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function resetTheme() {
        if (confirm("Reset to default theme?")) {
            GM_setValue("AuraBoxTheme", null);
            window.location.reload();
        }
    }

    function showNotification(message, isError = false) {
        const notification = document.createElement("div");
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 15px 20px;
            background: ${isError ? "#e74c3c" : "#2ecc71"};
            color: white; border-radius: 5px; z-index: 10000;
            font-family: inherit; font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // --- MAIN STYLING ENGINE ---

    // CSS Builder to avoid thrashing style.textContent
    let cssBuffer = [];

    function addCSS(css) {
        cssBuffer.push(css);
    }

    function applyTheme() {
        // Reset buffer
        cssBuffer = [];

        // Generate Styles
        styleAll();
        styleNavbar();
        styleClassesPage();
        styleClass();
        styleScrollBar();
        styleTimetablePage();
        styleGradesPage();
        stylePortfolioSelector();
        styleDueWorkPage();
        styleNewsPage();
        styleHomePage();

        // Apply to DOM once
        styleElement.textContent = cssBuffer.join("\n");
        if (!styleElement.isConnected) {
            document.documentElement.appendChild(styleElement);
        }

        addCredits();
    }

    // --- COMPONENT STYLING FUNCTIONS ---

    function styleHomePage() {
        addCSS(`
            .component-action section {
                background: ${theme.surface};
            }
            .fc .fc-cell-shaded {
                background: ${theme.surface}
            }
        `);

        function changeSpanStylesToColorText() {
            const spans = document.querySelectorAll("span");
            spans.forEach((span) => {
                span.style.color = theme.text;
            });
        }

        if (document.readyState === "loading") {
            document.addEventListener(
                "DOMContentLoaded",
                changeSpanStylesToColorText,
            );
        } else {
            changeSpanStylesToColorText();
        }
    }

    function styleNewsPage() {
        addCSS(`
            .tabs {
                background: ${theme.surface};
                border: none;
                outline: none;
            }
            .tabs dd>a, .tabs .tab-title>a {
                color: ${theme.text}
            }
            .side-nav li.active>a:first-child:not(.button):not(.adtp-btn):not(button):not([type=submit]):not(a.submit):not(button.submit):not(.show-ckeditor-button) {
                background-color: ${theme.surface};
                color: ${theme.text};
            }
            .side-nav li a:not(.button):not(.adtp-btn):not(button):not([type=submit]):not(a.submit):not(button.submit):not(.show-ckeditor-button) {
                color: ${theme.text}
            }
            .side-nav li a:not(.button):not(.adtp-btn):not(button):not([type=submit]):not(a.submit):not(button.submit):not(.show-ckeditor-button):hover, .side-nav li a:not(.button):not(.adtp-btn):not(button):not([type=submit]):not(a.submit):not(button.submit):not(.show-ckeditor-button):focus {
                color: ${theme.accent}
            }
            .side-nav {
                background-color: ${theme.surface}
            }
            .fc-theme-standard th, .fc-theme-standard td, .fc-theme-standard thead, .fc-theme-standard tbody, .fc-theme-standard .fc-divider, .fc-theme-standard .fc-row, .fc-theme-standard .fc-content, .fc-theme-standard .fc-popover, .fc-theme-standard .fc-list-view, .fc-theme-standard .fc-list-heading td, .fc .fc-row .fc-content-skeleton td {
                border: none;
            }
        `);
    }

    function addCredits() {
        function addTimetableCredits() {
            const subNavDL = document.querySelector("dl.sub-nav");
            if (!subNavDL) return;
            if (subNavDL.querySelector(".aurabox-credits")) return; // Prevent duplicate

            const dd1 = document.createElement("dd");
            dd1.className = "aurabox-credits";
            dd1.innerHTML = `<a class="credit-button">AuraBox ${VERSION}</a>`;

            const dd2 = document.createElement("dd");
            dd2.className = "aurabox-credits";
            dd2.innerHTML = `<a class="credit-button" href="https://github.com/Cyclate" target="_blank">Check out my other projects!</a>`;

            const firstDD = subNavDL.querySelector("dd");
            subNavDL.insertBefore(dd1, firstDD);
            subNavDL.appendChild(dd2);
        }

        function addCreditsAfterLoad() {
            const footerList = document.querySelector("#footer ul");
            if (footerList) {
                const newListItem = document.createElement("li");
                newListItem.innerHTML = `AuraBox ${VERSION}`;
                footerList.appendChild(newListItem);
            }
        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                addTimetableCredits();
                addCreditsAfterLoad();
            });
        } else {
            addTimetableCredits();
            addCreditsAfterLoad();
        }
    }

    function styleDueWorkPage() {
        addCSS(`
            .fc-header-toolbar.fc-toolbar.fc-toolbar-ltr {
                background-color: ${theme.surface};
            }
            .fc-toolbar .fc-button:hover, .fc-toolbar .fc-button.fc-button-active {
                color: ${theme.text} !important;
            }
            .fc-toolbar {
                border: none;
            }
            .filter-dropdown .filter-component {
                border: none;
                color: ${theme.text};
            }
            li sbx-pop-out {
                background-color: ${theme.background_light} !important;
            }
            .fc .fc-col-header-cell a {
                color: ${theme.heading}
            }
            a.fc-daygrid-day-number {
                color: ${theme.text}
            }
            .button, .adtp-btn, .attachzone .dzone.adtp-btn, .dropzone-wrap .dzone.adtp-btn, .show-ckeditor-button, .attachzone .dzone.show-ckeditor-button, .dropzone-wrap .dzone.show-ckeditor-button, .flex-list.buttons a, .flex-list.buttons button, .attachzone .flex-list.buttons a.dzone, .flex-list.buttons .attachzone a.dzone, .attachzone .flex-list.buttons button.dzone, .flex-list.buttons .attachzone button.dzone, .dropzone-wrap .flex-list.buttons a.dzone, .flex-list.buttons .dropzone-wrap a.dzone, .dropzone-wrap .flex-list.buttons button.dzone, .flex-list.buttons .dropzone-wrap button.dzone, [type=submit], .flex-list.buttons a.submit, .flex-list.buttons button.submit, a.submit, button.submit, .attachzone .dzone[type=submit], .attachzone a.dzone.submit, .attachzone button.dzone.submit, .dropzone-wrap .dzone[type=submit], .dropzone-wrap a.dzone.submit, .dropzone-wrap button.dzone.submit, button, .attachzone button.dzone, .dropzone-wrap button.dzone, .attachzone .dropzone-wrap button.dzone, .dropzone-wrap .attachzone button.dzone, .context-switch nav a, .avatar-switch nav a, .attachzone .dzone.button, .attachzone button.dzone, .attachzone button.dzone, .attachzone .context-switch nav a.dzone, .attachzone .avatar-switch nav a.dzone, .context-switch nav .attachzone a.dzone, .avatar-switch nav .attachzone a.dzone, .dropzone-wrap .dzone.button, .dropzone-wrap button.dzone, .dropzone-wrap button.dzone, .dropzone-wrap .context-switch nav a.dzone, .dropzone-wrap .avatar-switch nav a.dzone, .context-switch nav .dropzone-wrap a.dzone, .avatar-switch nav .dropzone-wrap a.dzone {
                color: ${theme.text}
            }
            .checklist.item.filter-component {
                background-color: ${theme.surface}
            }
            .small-12.column.no-pad {
                background-color: ${theme.surface}
            }
        `);
    }

    function styleClass() {
        addCSS(`
            #component-layout .column-top .component-titlebar {
                background-color: ${theme.background};
            }

            .island section {
                background: ${theme.surface};
                backdrop-filter: blur(20px);
            }

            #component-layout .column-right .island section {
                background: transparent;
            }

            .VueTables__wrapper, .VueTables__table-footer, .filters[data-v-053bbdac], .VueTables__search, #component-layout .column-left .island section, .empty-state, .empty-state-flex-centered, #component-layout .column-right .component-titlebar, .editPanel.socialstream-new-post, #component-layout .column-left .component-titlebar, .calendar-list>li, .marking-input-list>li, .weather-list>li, .weather-forecast>li, .action-list>li, ul.az-list>li, ul.az-error-list>li, .resource-list>li, .permission-list>li, .news-list>li, .subject-list>li, .activity-list>li, .information-list>li, .VueTables__wrapper, .VueTables__table-footer, .filters[data-v-053bbdac], .VueTables__search, #component-layout .column-left .island section, .empty-state, .empty-state-flex-centered, #component-layout .column-right .component-titlebar, .editPanel.socialstream-new-post, #component-layout .column-left .component-titlebar, .calendar-list>li, .marking-input-list>li, .weather-list>li, .weather-forecast>li, .action-list>li, ul.az-list>li, ul.az-error-list>li, .resource-list>li, .permission-list>li, .news-list>li, .subject-list>li, .activity-list>li, .information-list>li, .VueTables__wrapper, .VueTables__table-footer, .filters[data-v-053bbdac], .VueTables__search, #component-layout .column-left .island section, .empty-state, .empty-state-flex-centered, #component-layout .column-right .component-titlebar, .editPanel.socialstream-new-post, #component-layout .column-left .component-titlebar, .calendar-list>li, .marking-input-list>li, .weather-list>li, .weather-forecast>li, .action-list>li, ul.az-list>li, ul.az-error-list>li, .resource-list>li, .permission-list>li, .news-list>li, .subject-list>li, .activity-list>li, .information-list>li, .VueTables__wrapper, .VueTables__table-footer, .filters[data-v-053bbdac], .VueTables__search, #component-layout .column-left .island section, .empty-state, .empty-state-flex-centered, #component-layout .column-right .component-titlebar, .editPanel.socialstream-new-post, #component-layout .column-left .component-titlebar, .calendar-list>li, .marking-input-list>li, .weather-list>li, .weather-forecast>li, .action-list>li, ul.az-list>li, ul.az-error-list>li, .resource-list>li, .permission-list>li, .news-list>li, .subject-list>li, .activity-list>li, .information-list>li {
                border: 0px;
                background-color: ${theme.background};
            }

            ul.grid.small-block-grid-1.medium-block-grid-2 {

                background-color: ${theme.background};
            }
            .component-action section {
                border: 0px;
            }

            .breadcrumb li.active span:not([href]), #component-layout .column-left .island section {
                color: ${theme.text};
            }

            input:not([type]), input[type=text], input[type=password], input[type=date], input[type=datetime], input[type=datetime-local], input[type=month], input[type=week], input[type=email], input[type=number], input[type=search], input[type=tel], input[type=time], input[type=url], input[type=color], textarea, input:hover, textarea:hover, select:hover {
                border: 0px;
            }

            .breadcrumb li a[href], .breadcrumb li span[href] {
                background-color: ${theme.background_light};
            }

            .breadcrumb li.active span, .breadcrumb li.active span:after{
                background-color: ${theme.background_lighter};
                border: 0px;
            }

            .breadcrumb li a[href]:after, .breadcrumb li span[href]:after {
                border-left: .4rem solid ${theme.background_light};
            }

            .breadcrumb li a:before, .breadcrumb li span:before {
                border-left: .4rem solid ${theme.background_lighter};
            }

            .breadcrumb li a[href]:hover, .breadcrumb li span[href]:hover {
                background-color: ${theme.background_lighter};
            }

            .breadcrumb li a[href]:hover:after {
                border-left-color: ${theme.background_lighter};
            }

            .sbx-button[data-v-4b5a0ce8] {
                fill: ${theme.accent} !important;
            }

            .sbx-button__icon[data-v-4b5a0ce8]:hover {
                fill: ${theme.heading}
                background-color: ${theme.background_light}
            }

            section div.small-12 div.actions-small-1 nav {
                display: none !important;
            }

            .context-switch .semester select, .avatar-switch .semester select, .context-switch .subject select, .avatar-switch .subject select {
                margin: 0px;
                height: 44px;
            }

            div.list-item a:hover {
                background: ${theme.background_light}
            }

            .card.compact {
                padding-right: 0px;
            }
        `);
    }

    function styleClassesPage() {
        removeClassCards();
        styleCards();
    }

    function styleCards() {
        addCSS(`
            div.card-content.classes.actions-small-1 {
                background-color: transparent;
            }

            a[data-semester-switch], .context-switch nav a {
                background-color: ${theme.surface};
            }

            .context-switch nav a[disabled] {
                background-color: ${theme.inputDisabled}
            }
        `);
    }

    function removeClassCards() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (!(node instanceof HTMLElement)) return;
                    if (node.classList?.contains("card-class-image")) {
                        node.remove();
                    }
                    const targets =
                        node.querySelectorAll?.("div.card-class-image") || [];
                    targets.forEach((el) => el.remove());
                });
            });
        });

        observer.observe(document, { childList: true, subtree: true });
    }

    function styleAll() {
        addCSS(`
            *, *::before, *::after {
                box-shadow: none !important;
                outline: none !important;
            }

            * {
                border: none;
            }

            label, body, html, header, nav, .navbar, .sidebar, .footer, .panel, .card, .content, .main, span {
                color: ${theme.text};
            }

            body, html, section.main {
                background-color: ${theme.background} !important;
                background-image: url('${theme.backgroundImage}') !important;
                background-size: cover !important;
                background-attachment: fixed !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
                font-weight: 500;
            }

            .sidebar, .footer, .panel, .card, .content, .main {
                background-color: transparent !important;
                border-color: ${theme.border} !important;
                border: 0px;
            }

            h1, h2, h3, h4, h5, h6 {
                color: ${theme.heading} !important;
                font-weight: 600;
            }

            a, .link, .btn-link {
                color: ${theme.accent};
            }

            a:hover {
                color: ${theme.text};
            }

            table, td {
                background-color: ${theme.tableBg} !important;
                color: ${theme.text} !important;
                border: 1px solid ${theme.border} !important;
                backdrop-filter: blur(${theme.blur_amount}px);
            }

            th {
                background-color: ${theme.tableHeader} !important;
                color: ${theme.heading} !important;
                border-color: ${theme.border} !important;
                font-weight: 600;
            }

            table thead {
                background-color: transparent;
            }

            input, select, textarea, input::placeholder {
                background-color: ${theme.inputBg} !important;
                color: ${theme.heading} !important;
                border: 0px;
            }

            ::selection {
                background: ${theme.selectionBg};
                color: ${theme.selectionText};
            }

            header, nav, .navbar, .hybrid-bar, #container, ul#top-menu, a.logo, a#left-off-canvas-toggle, #footer, .tab-bar, .tab_bar {
                background-color: transparent !important;
                background: transparent !important;
                border: 0px;
            }

            button, .button, input[type="button"], input[type="submit"] {
                background-color: ${theme.surface} !important;
                color: ${theme.text} !important;
                cursor: pointer;
            }

            button:hover, .button:hover, input[type="button"]:hover, input[type="submit"]:hover {
                background-color: ${theme.tableHeader} !important;
                color: ${theme.heading} !important;
                border-color: ${theme.accent} !important;
            }

            button:focus, .button:focus, input[type="button"]:focus, input[type="submit"]:focus {
                outline: none;
            }

            button:active, .button:active, input[type="button"]:active, input[type="submit"]:active {
                background-color: ${theme.background} !important;
                color: ${theme.accent} !important;
                border-color: ${theme.accent} !important;
            }

            button:disabled, .button:disabled, input[type="button"]:disabled, input[type="submit"]:disabled {
                background-color: ${theme.border} !important;
                color: #666 !important;
                cursor: not-allowed;
                opacity: 0.6;
            }

            time, p.meta {
                color: ${theme.secondaryText};
            }

            dd a {
                background-color: ${theme.surface} !important;
                color: ${theme.accent};
                border: 0px;
                text-decoration: none !important;
            }

            dd a:hover {
                background-color: ${theme.tableHeader} !important;
                color: ${theme.text} !important;
            }

            :root {
                --content-ui-hover: ${theme.background_light};
                --content-ui-foreground: ${theme.text};
                --content-ui-background: ${theme.background_light};
                --color-text-primary: ${theme.text};
                --accent-foreground: ${theme.accent}
            }
        `);
    }

    function styleNavbar() {
        addCSS(`
            .hybrid-bar .top-menu li a:before, span[data-unread-count], a#notification-toggle::before, .hybrid-bar .top-menu li span{
                color: ${theme.secondaryText};
            }

            .hybrid-bar .top-menu li > a:hover,
            .hybrid-bar .top-menu li > a:focus,
            .hybrid-bar .top-menu li > a:focus-visible {
                background-color: transparent !important;
                color: ${theme.heading} !important;
                text-decoration: none;
            }

            .hybrid-bar .top-menu li > a:hover::before,
            .hybrid-bar .top-menu li > a:hover span,
            .hybrid-bar .top-menu li > a:focus::before,
            .hybrid-bar .top-menu li > a:focus span {
                color: ${theme.heading} !important;
            }

            .hybrid-bar .top-menu li > a.navthis {
                background: transparent !important;
                color: ${theme.heading} !important;
            }

            .c-search-input input[type=text].c-search-input__field, div.c-header-search__results {
                border: 0px;
            }

            .off-canvas-list.second-nav, .profile-drop {
                background-color: ${theme.surface} !important;
            }

            .left-off-canvas-menu ul.off-canvas-list li a:hover {
                background-color: transparent;
            }

            .left-off-canvas-menu {
                background: ${theme.surface}
            }
            ul.off-canvas-list li a:not([data-pwa-action=retryNotifPrompt]) {
                color: ${theme.accent}
            }
            .left-off-canvas-menu ul.off-canvas-list li a:hover {
                color: ${theme.heading};
                background-color: ${theme.background_light}
            }
        `);
    }

    function styleTimetablePage() {
        styleTimetableSelector();
        timeTableTransparency();
        insertActiveShading();
        optimizeTimetableLayout();
    }

    function timeTableTransparency() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (!(node instanceof HTMLElement)) return;

                    const subjectDivs =
                        node.querySelectorAll?.(".timetable-subject") || [];
                    subjectDivs.forEach((div) => {
                        const anchor = div.querySelector("a");
                        if (!anchor) return;
                        const [r, g, b] = div.style.backgroundColor
                            .match(/\d+/g)
                            .map(Number);
                        const alpha = 0.1; // Apply new RGBA color
                        div.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    });
                });
            });
        });

        observer.observe(document, { childList: true, subtree: true });
    }

    function optimizeTimetableLayout() {
        // 1. CSS to compress the table, expand width, and fill cells
        addCSS(`

            /* Remove padding from table cells so the subject div touches edges */
            table.timetable td {
                padding: 0px !important;
                height: 1px !important; /* CSS Trick: Forces cells to share height */
                vertical-align: top !important;
            }

            /* Ensure the intermediate div inside td fills the space */
            table.timetable td > div {
                height: 100% !important;
                width: 100% !important;
            }

            /* Make the subject container fill the parent completely */
            .timetable-subject {
                height: 100% !important;
                width: 100% !important;
                min-height: 40px !important;
                padding: 6px !important; /* Add internal padding for text */
                box-sizing: border-box !important;
                margin: 0 !important;
                border-radius: 0 !important; /* Optional: squared edges look better when filling */
            }

            /* Adjust font sizes for compact view */
            .timetable-subject a {
                font-size: 0.9em;
                font-weight: bold;
                display: block; /* Helps clickable area */
            }
            .timetable-subject div {
                font-size: 0.8em;
                line-height: 1.2;
            }

            /* Keep header padding */
            table.timetable th {
                padding: 4px !important;
            }

            /* Flex container for the header to sit next to buttons */

            .timetable-header-flex dl.sub-nav {
                margin: 0 !important;
            }

            .timetable-header-flex {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
            }

            .timetable-header-flex dl.sub-nav {
                margin-left: auto !important;
                display: flex !important;
                gap: 0rem;
            }

            div#container {
                display: flex;
                flex-direction: column;
            }

            div#content {
                display: flex;
                flex-direction: column;
                flex: 1;
            }

            // .row{
            //     flex: none;
            // }

            .row[data-timetable-wrapper], .row[data-timetable-wrapper] > div.small-12.columns, .row[data-timetable-wrapper] > div.small-12.columns > .scrollable, .row[data-timetable-wrapper] > div.small-12.columns > .scrollable > timetable {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
        `);

        // 2. JS to move the Header Title next to the Buttons
        const moveHeader = () => {
            const subNav = document.querySelector("dl.sub-nav");
            const originalTitle = document.querySelector(
                "h1[data-timetable-title]",
            );

            if (
                subNav &&
                originalTitle &&
                !document.querySelector(".timetable-header-flex")
            ) {
                // The subNav is usually in: div.row > div.small-12 > dl.sub-nav
                const container = subNav.parentElement;

                // Create a wrapper for flex styling
                const flexWrapper = document.createElement("div");
                flexWrapper.className = "timetable-header-flex";

                // Insert wrapper into the column
                container.insertBefore(flexWrapper, subNav);

                // Move elements into wrapper: Title first, then buttons
                flexWrapper.appendChild(originalTitle);
                flexWrapper.appendChild(subNav);
            }
        };

        function removeFirstColumn(selector) {
            const wrapper = document.querySelector(selector);
            if (!wrapper) return;
            const firstCol = wrapper.querySelector(".small-12.columns");
            if (firstCol) {
                firstCol.remove();
            }
        } // Run once on load removeFirstColumn();

        const observer = new MutationObserver(() => {});
        if (document.body instanceof Node) {
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            console.warn("document.body is not ready yet");
        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                moveHeader();
                removeFirstColumn("div.row[data-timetable-wrapper]");
                removeFirstColumn("div.row-hide[data-timetable-wrapper]");
            });
        } else {
            moveHeader();
        }

        // // Even Padding
        // (function () {
        //     const style = document.createElement("style");
        //     style.textContent = ` #content > .row > .small-12, .rubric-criterion-selector #content > .row > .criteria-group, #content > .row > .medium-12, #content > .row > .list-item > .small-12, .rubric-criterion-selector #content > .row > .list-item > .criteria-group, #content > .row > .list-item > .medium-12 { padding-left: 0 !important; } `;
        //     document.head.appendChild(style);
        // })();
    }

    function insertActiveShading() {
        addCSS(`
            th.timetable-day-active {
                background-color: ${theme.background_lighter} !important;
            }
            .timetable td .timetable-subject-active {
                border: .125rem solid ${theme.background_lighter};
            }
            .timetable td .timetable-subject-active::before {
                display: none;
            }
        `);
    }

    function styleTimetableSelector() {
        addCSS(`
            a[data-timetable-selector], .sub-nav dd a {
                background-color: ${theme.surface} !important;
                color: ${theme.accent};
                border: 0px;
                text-decoration: none !important;
            }

            a.credit-button {
                color: ${theme.heading} !important;
            }

            a[data-timetable-selector]:hover, a.credit-button:hover, .sub-nav dd a:hover {
                background-color: ${theme.tableHeader} !important;
                color: ${theme.text} !important;
            }

            .sub-nav li.active a, .sub-nav dd.active a {
                background-color: ${theme.surface} !important;
                color: ${theme.accent};
                border: 0px;
                text-decoration: none !important;
            }
        `);
    }

    function styleScrollBar() {
        addCSS(`
            :root {
                --scroll-track: ${theme.scroll_track};
                --scroll-thumb: ${theme.scroll_thumb};
                --scroll-thumb-hover: ${theme.scroll_thumb_hover};
                --scroll-thumb-active: ${theme.scroll_thumb_active};
                --scroll-corner: ${theme.scroll_thumb_hover};
            }

            * {
                scrollbar-width: thin;
                scrollbar-color: var(--scroll-thumb) var(--scroll-track);
            }

            *::-webkit-scrollbar {
                width: 12px;
                height: 12px;
            }

            *::-webkit-scrollbar-track {
                background: var(--scroll-track);
            }

            *::-webkit-scrollbar-thumb {
                background: var(--scroll-thumb);
                border: 0px solid var(--scroll-track);
                border-radius: 0px;
            }

            *::-webkit-scrollbar-thumb:hover {
                background: var(--scroll-thumb-hover);
            }

            *::-webkit-scrollbar-thumb:active {
                background: var(--scroll-thumb-active);
            }

            *::-webkit-scrollbar-corner {
                background: var(--scroll-corner);
            }
        `);
    }

    function styleGradesPage() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (!(node instanceof HTMLElement)) return;

                    for (let i = 1; i <= 10; i++) {
                        const color = gradeTheme[10 - i];
                        if (
                            node.classList &&
                            node.classList.contains(`gradient-${i}-bg`)
                        ) {
                            node.style.setProperty(
                                "background-color",
                                color,
                                "important",
                            );
                            node.style.setProperty(
                                "background-image",
                                "none",
                                "important",
                            );
                            node.style.setProperty("fill", color, "important");
                        }
                        const descendants = node.querySelectorAll(
                            `div.gradient-${i}-bg`,
                        );
                        descendants.forEach((el) => {
                            el.style.setProperty(
                                "background-color",
                                color,
                                "important",
                            );
                            el.style.setProperty(
                                "background-image",
                                "none",
                                "important",
                            );
                            el.style.setProperty("fill", color, "important");
                        });
                    }
                });
            });
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });

        addCSS(`
            blockquote {
                background-color: ${theme.background_light};
                border-left: 6px solid ${theme.accent} !important;
                color: ${theme.heading};
                font-weight: 400;
            }
            blockquote:before {
                color: ${theme.accent}
            }

            .activity-list.group {
                border-bottom: 1rem solid ${theme.background}
            }

            div.flex-grade div.small-12 a p {
                color: ${theme.text} !important;
                font-weight: 500;
            }
        `);
    }

    function stylePortfolioSelector() {
        addCSS(`
            .sub-nav li a, .sub-nav dd a {
                background-color: ${theme.surface} !important;
                color: ${theme.accent};
                border: 0px;
                text-decoration: none !important;
                backdrop-filter: blur(${theme.blur_amount}px);
            }
            a[data-timetable-selector]:hover, a.credit-button:hover, .sub-nav dd a:hover {
                background-color: ${theme.tableHeader} !important;
                color: ${theme.text} !important;
            }
        `);
    }

    // --- INITIALIZATION ---

    GM_registerMenuCommand("AuraBox: Settings", openSettingsModal);
    GM_registerMenuCommand(
        "AuraBox: Export New Theme from Image",
        exportThemeFromImage,
    );
    GM_registerMenuCommand("AuraBox: Export Current Theme", exportTheme);
    GM_registerMenuCommand("AuraBox: Import Theme", importTheme);
    GM_registerMenuCommand("AuraBox: Reset to Default", resetTheme);

    loadSavedTheme();
    applyTheme();
})();
