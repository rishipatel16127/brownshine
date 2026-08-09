// DOM Elements and App State
document.addEventListener("DOMContentLoaded", () => {
    // Live date
    const dateEl = document.getElementById("live-date");
    if (dateEl) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }

    // App state
    const state = {
        activeTab: "dashboard",
        currentIndustry: "thermal-power-new",
        emissions: {
            pm: 25,
            so2: 90,
            nox: 280,
            co: 120
        },
        gis: {
            projectName: "Greenfield Infrastructure Phase 1",
            lat: 19.2980,
            lng: 72.8420,
            nearestParkName: "Sanjay Gandhi National Park",
            nearestDistance: 8.42,
            verdict: "Warning: Within 10km Buffer"
        },
        classification: {
            category: "Category B1",
            authority: "SEIAA (State level)",
            eiaRequired: "Yes",
            reasons: ["Project type is Mineral Mining.", "Mining lease area (45 Ha) is between 5 and 100 Hectares.", "General Conditions not triggered."]
        }
    };

    // Databases
    const emissionStandards = {
        "thermal-power-new": {
            name: "Thermal Power Plant (Post-2017)",
            limits: { pm: 30, pm25: null, so2: 100, nox: 100, co: null }
        },
        "thermal-power-old": {
            name: "Thermal Power Plant (Pre-2017)",
            limits: { pm: 50, pm25: null, so2: 200, nox: 300, co: null }
        },
        "cement-kiln": {
            name: "Cement Plants (Kiln emissions)",
            limits: { pm: 30, pm25: null, so2: 100, nox: 600, co: null }
        },
        "iron-steel": {
            name: "Iron & Steel (Sinter Plant)",
            limits: { pm: 50, pm25: null, so2: 150, nox: 300, co: null }
        },
        "oil-refinery": {
            name: "Oil Refinery (FCCU Stacks)",
            limits: { pm: 50, pm25: null, so2: 500, nox: 350, co: 300 }
        },
        "sugar-boiler": {
            name: "Sugar Industry (Boilers)",
            limits: { pm: 150, pm25: null, so2: 250, nox: 250, co: null }
        },
        "brick-kiln": {
            name: "Brick Kiln (Zig-Zag Type)",
            limits: { pm: 50, pm25: null, so2: 100, nox: 300, co: null } // standard stack metrics
        },
        // ---- Additional industries per CPCB Schedule VI (Environment Protection Rules, 1986) ----
        "fertilizer-urea": {
            name: "Fertilizer (Urea Plant, Post-1992)",
            limits: { pm: 50, pm25: null, so2: null, nox: null, co: null } // Schedule VI Annexure-II(g)
        },
        "pulp-paper": {
            name: "Pulp & Paper Industry",
            limits: { pm: 150, pm25: null, so2: null, nox: null, co: null } // General standard, Schedule VI Part-D
        },
        "aluminium-smelter": {
            name: "Aluminium Smelter (Calcination/Pot Room)",
            limits: { pm: 250, pm25: null, so2: null, nox: null, co: null } // Schedule VI Annexure-II(b), calcination process
        },
        "glass-industry": {
            name: "Glass Industry",
            limits: { pm: 150, pm25: null, so2: null, nox: null, co: null } // General standard; fluoride (5 mg/Nm3) tracked separately
        },
        "lime-kiln": {
            name: "Lime Kiln (5-40 TPD)",
            limits: { pm: 500, pm25: null, so2: null, nox: null, co: null } // Schedule VI Annexure-II(d)
        },
        "industrial-boiler": {
            name: "Industrial Boiler (Small, <2 T/hr)",
            limits: { pm: 1000, pm25: null, so2: 400, nox: null, co: null } // Schedule VI Annexure-II(h) + boiler SO2 norm
        },
        "foundry-cupola": {
            name: "Foundry (Cupola Furnace, <3 T/hr)",
            limits: { pm: 450, pm25: null, so2: null, nox: null, co: null } // Schedule VI Annexure-II(3)
        },
        "coke-oven": {
            name: "Coke Oven Plant",
            limits: { pm: 50, pm25: null, so2: null, nox: null, co: null } // Schedule VI Annexure-II(g)
        },
        "ceramic-industry": {
            name: "Ceramic Industry",
            limits: { pm: 150, pm25: null, so2: null, nox: null, co: null } // General standard, Schedule VI Annexure-II(k)
        },
        "pharmaceutical": {
            name: "Pharmaceutical (Mfg & Formulation)",
            limits: { pm: 150, pm25: null, so2: null, nox: null, co: null } // General standard; VOC/effluent norms tracked separately
        },
        "custom-other": {
            name: "Other / Custom Industry (Manual Limits)",
            limits: { pm: null, pm25: null, so2: null, nox: null, co: null } // Populated at runtime from the Custom Limits panel
        }
    };

    const protectedAreas = [
        { name: "Sanjay Gandhi National Park", lat: 19.2290, lng: 72.8600, state: "Maharashtra" },
        { name: "Gir National Park", lat: 21.1244, lng: 70.8242, state: "Gujarat" },
        { name: "Jim Corbett National Park", lat: 29.5300, lng: 78.7747, state: "Uttarakhand" },
        { name: "Kaziranga National Park", lat: 26.5775, lng: 93.1711, state: "Assam" },
        { name: "Sundarbans National Park", lat: 21.9497, lng: 88.8956, state: "West Bengal" },
        { name: "Guindy National Park", lat: 13.0076, lng: 80.2206, state: "Tamil Nadu" },
        { name: "Thol Bird Sanctuary", lat: 23.1390, lng: 72.4136, state: "Gujarat" },
        { name: "Nal Sarovar Bird Sanctuary", lat: 22.7670, lng: 72.0330, state: "Gujarat" },
        { name: "Girnar Wildlife Sanctuary", lat: 21.4170, lng: 70.5000, state: "Gujarat" }
    ];

    // ==========================================
    // 1. ROUTING / TABS ROUTER
    // ==========================================
    const navItems = document.querySelectorAll(".sidebar-nav li");
    const tabContents = document.querySelectorAll(".tab-content");
    const pageTitle = document.getElementById("page-title");
    const pageSubtitle = document.getElementById("page-subtitle");

    const tabHeaders = {
        "dashboard": { title: "Compliance Dashboard", subtitle: "Real-time emission verification & clearance assistance" },
        "emission-checker": { title: "Emission Checker", subtitle: "Verify stack outputs against official CPCB legal standards" },
        "gis-screener": { title: "GIS Proximity Buffer Analyzer", subtitle: "Determine proximity to environmentally protected areas in India" },
        "category-classifier": { title: "Project Categorization Wizard", subtitle: "Identify clearance level and EIA study requirements" },
        "regulations": { title: "Statutory Regulations Library", subtitle: "Access Environment Protection Act gazettes and guidelines" },
        "state-norms": { title: "State Pollution Control Board Norms", subtitle: "Configure and override state-specific environmental limits (GPCB, MPCB, UPPCB, CPCB...)" }
    };

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const tabId = item.getAttribute("data-tab");

            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");

            tabContents.forEach(content => {
                content.classList.remove("active");
                if (content.id === tabId) {
                    content.classList.add("active");
                }
            });

            // Update Headers
            if (tabHeaders[tabId]) {
                pageTitle.textContent = tabHeaders[tabId].title;
                pageSubtitle.textContent = tabHeaders[tabId].subtitle;
            }

            state.activeTab = tabId;

            // Trigger map refresh if switching to GIS map to avoid canvas render bugs
            if (tabId === "gis-screener" && leafletMap) {
                setTimeout(() => {
                    leafletMap.invalidateSize();
                }, 100);
            }
        });
    });

    // ==========================================
    // 2. CHART.JS CONFIGURATION (DASHBOARD CHART)
    // ==========================================
    const ctx = document.getElementById("dashboardChart").getContext("2d");
    let dashboardChart;

    function initChart() {
        const indData = emissionStandards[state.currentIndustry];
        const activeLimits = getActiveLimits();
        const labels = [];
        const userValues = [];
        const limitValues = [];

        // Determine parameters for current industry selection
        Object.keys(activeLimits).forEach(key => {
            if (activeLimits[key] !== null) {
                labels.push(key.toUpperCase());
                userValues.push(state.emissions[key]);
                limitValues.push(activeLimits[key]);
            }
        });

        dashboardChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Measured Emissions (mg/Nm³)",
                        data: userValues,
                        backgroundColor: "rgba(79, 122, 99, 0.65)",
                        borderColor: "rgba(79, 122, 99, 1)",
                        borderWidth: 1.5,
                        borderRadius: 6
                    },
                    {
                        label: "CPCB Legal Limit (mg/Nm³)",
                        data: limitValues,
                        backgroundColor: "rgba(181, 72, 47, 0.2)",
                        borderColor: "rgba(181, 72, 47, 0.8)",
                        borderWidth: 1.5,
                        borderRadius: 6,
                        borderDash: [3, 3]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Horizontal bars
                plugins: {
                    legend: {
                        labels: {
                            color: "#d1d5db",
                            font: { family: "Inter", size: 12 }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: "rgba(255,255,255,0.05)" },
                        ticks: { color: "#9ca3af" }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: "#d1d5db", font: { weight: "600" } }
                    }
                }
            }
        });
    }

    function updateChartData() {
        if (!dashboardChart) return;
        const activeLimits = getActiveLimits();
        const labels = [];
        const userValues = [];
        const limitValues = [];

        Object.keys(activeLimits).forEach(key => {
            if (activeLimits[key] !== null) {
                labels.push(key.toUpperCase());
                userValues.push(state.emissions[key]);
                limitValues.push(activeLimits[key]);
            }
        });

        dashboardChart.data.labels = labels;
        dashboardChart.data.datasets[0].data = userValues;
        dashboardChart.data.datasets[1].data = limitValues;
        dashboardChart.update();
    }

    // ==========================================
    // 3. COMPLIANCE AUDIT ENGINE (EMISSIONS)
    // ==========================================
    const emissionForm = document.getElementById("emission-form");
    const industrySelect = document.getElementById("industry-select");
    const coGroup = document.getElementById("co-group");
    const customLimitsPanel = document.getElementById("custom-limits-panel");

    // Returns the limits to audit against for the currently selected industry —
    // for the built-in list this is just the CPCB Schedule VI table, but for
    // "Other / Custom Industry" it reads directly from the manual limit inputs
    // (any left blank are treated as "not applicable" and simply skipped).
    function getActiveLimits() {
        if (state.currentIndustry !== "custom-other") {
            return emissionStandards[state.currentIndustry].limits;
        }
        const readCustom = (id) => {
            const el = document.getElementById(id);
            const val = el ? parseFloat(el.value) : NaN;
            return isNaN(val) ? null : val;
        };
        return {
            pm: readCustom("custom-limit-pm"),
            so2: readCustom("custom-limit-so2"),
            nox: readCustom("custom-limit-nox"),
            co: readCustom("custom-limit-co")
        };
    }

    // Dynamic field toggle (hide/show CO based on industry limit presence, and
    // reveal the Custom Limits panel when "Other / Custom Industry" is chosen).
    //
    // Critically, this ALSO updates state.currentIndustry and re-runs the audit
    // immediately — previously state.currentIndustry was only updated inside the
    // form's submit handler, so switching the dropdown without clicking submit left
    // the results panel silently showing results for the *previous* industry's
    // limits while the dropdown displayed the new selection (e.g. switching to
    // "Other / Custom Industry" still showed the old Thermal Power Plant limits
    // and its flagged NOx exceedance, because nothing had re-run the check yet).
    industrySelect.addEventListener("change", (e) => {
        const selected = e.target.value;
        state.currentIndustry = selected;

        if (customLimitsPanel) {
            customLimitsPanel.classList.toggle("hidden", selected !== "custom-other");
        }

        if (selected === "custom-other") {
            if (coGroup) coGroup.classList.remove("hidden");
        } else {
            const specs = emissionStandards[selected];
            if (specs.limits.co === null) {
                coGroup.classList.add("hidden");
            } else {
                coGroup.classList.remove("hidden");
            }
        }

        runEmissionsAudit();
        updateChartData();
    });

    emissionForm.addEventListener("submit", (e) => {
        e.preventDefault();

        // Save inputs to state
        state.currentIndustry = industrySelect.value;
        state.emissions.pm = Number(document.getElementById("input-pm").value) || 0;
        state.emissions.so2 = Number(document.getElementById("input-so2").value) || 0;
        state.emissions.nox = Number(document.getElementById("input-nox").value) || 0;

        const coInput = document.getElementById("input-co");
        if (coInput && !coGroup.classList.contains("hidden")) {
            state.emissions.co = Number(coInput.value) || 0;
        }

        runEmissionsAudit();
        updateChartData();
    });

    // Live-update as the PM/SO2/NOx/CO values themselves are typed — this tool's
    // whole premise is "real-time emission verification", so results should track
    // what's currently in the fields without waiting for an explicit submit click.
    // Lightly debounced so rapid keystrokes don't re-run the audit on every digit.
    let emissionsInputDebounce = null;
    ["input-pm", "input-so2", "input-nox", "input-co"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", () => {
            clearTimeout(emissionsInputDebounce);
            emissionsInputDebounce = setTimeout(() => {
                state.emissions.pm = Number(document.getElementById("input-pm").value) || 0;
                state.emissions.so2 = Number(document.getElementById("input-so2").value) || 0;
                state.emissions.nox = Number(document.getElementById("input-nox").value) || 0;
                const coInput = document.getElementById("input-co");
                if (coInput && !coGroup.classList.contains("hidden")) {
                    state.emissions.co = Number(coInput.value) || 0;
                }
                runEmissionsAudit();
                updateChartData();
            }, 350);
        });
    });

    // Re-run live as the custom limit fields are edited, so a Custom/Other
    // industry audit updates without needing to click submit again.
    ["custom-limit-pm", "custom-limit-so2", "custom-limit-nox", "custom-limit-co"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", () => {
                if (state.currentIndustry === "custom-other") {
                    runEmissionsAudit();
                    updateChartData();
                }
            });
        }
    });

    function runEmissionsAudit() {
        const currentSpec = emissionStandards[state.currentIndustry];
        const limits = getActiveLimits();
        const cardsContainer = document.getElementById("parameter-cards-container");
        const auditBanner = document.getElementById("audit-banner");
        const auditTitle = document.getElementById("audit-status-title");
        const auditDesc = document.getElementById("audit-status-desc");
        const aiMitigationContent = document.getElementById("ai-mitigation-content");

        cardsContainer.innerHTML = "";
        let hasExceedance = false;
        let failedParams = [];
        let anyLimitSet = false;

        Object.keys(limits).forEach(param => {
            if (limits[param] === null) return; // Parameter not applicable
            anyLimitSet = true;

            const userVal = state.emissions[param];
            const limitVal = limits[param];
            const isExceeded = userVal > limitVal;
            const percent = Math.min(100, Math.round((userVal / limitVal) * 100));

            if (isExceeded) {
                hasExceedance = true;
                failedParams.push(param.toUpperCase());
            }

            const paramCardHTML = `
                <div class="param-card ${isExceeded ? 'failed' : ''}">
                    <div class="param-info">
                        <h5>${param.toUpperCase()} Emissions</h5>
                        <p>Limit: ${limitVal} mg/Nm³</p>
                        <div style="width: 150px; background: rgba(255,255,255,0.06); height: 6px; border-radius: 3px; margin-top: 6px; overflow: hidden;">
                            <div style="width: ${percent}%; background: ${isExceeded ? 'var(--color-danger)' : 'var(--color-success)'}; height: 100%;"></div>
                        </div>
                    </div>
                    <div class="param-value-wrap">
                        <span class="param-val ${isExceeded ? 'text-danger' : 'text-success'}">${userVal}</span>
                        <span class="unit">mg/Nm³</span>
                        <div class="param-limit">${percent}% of limit</div>
                    </div>
                </div>
            `;
            cardsContainer.insertAdjacentHTML("beforeend", paramCardHTML);
        });

        // Update UI banners and dashboard state based on check
        const dashStackStatus = document.getElementById("dash-stack-status");

        if (!anyLimitSet) {
            auditBanner.className = "status-banner warning";
            auditBanner.querySelector(".banner-icon").innerHTML = '<i class="fa-solid fa-circle-info"></i>';
            auditTitle.textContent = "No Custom Limits Entered Yet";
            auditDesc.textContent = "Enter at least one limit in the Custom Limits panel above to run a compliance check for this industry.";
            if (dashStackStatus) {
                dashStackStatus.textContent = "Awaiting Custom Limits";
                dashStackStatus.className = "stat-value text-warning";
            }
            aiMitigationContent.innerHTML = "<p><i class='fa-solid fa-circle-info text-accent'></i> Fill in the PM/SO\u2082/NOx/CO limits from the plant's actual CTO/EC consent order to audit against them.</p>";
            return;
        }

        if (hasExceedance) {
            // Exceeded standards
            auditBanner.className = "status-banner danger";
            auditBanner.querySelector(".banner-icon").innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            auditTitle.textContent = "CPCB Standards Violated";
            auditDesc.textContent = `Alert: ${failedParams.join(" & ")} values exceeded the statutory threshold limits.`;

            if (dashStackStatus) {
                dashStackStatus.textContent = "Violating Standards";
                dashStackStatus.className = "stat-value text-danger";
            }

            // Generate customized mitigation text
            let advice = "<strong>Recommendations for Stack Control:</strong><ul>";
            if (failedParams.includes("PM")) {
                advice += "<li>Optimize Electrostatic Precipitator (ESP) field charging voltages and check rapper timers.</li>";
                advice += "<li>Inspect filter bags for leaks/tears in fabric filter baghouse.</li>";
            }
            if (failedParams.includes("SO2")) {
                advice += "<li>Increase lime slurry spraying rate in Flue-Gas Desulfurization (FGD) scrubber system.</li>";
                advice += "<li>Check dry sorbent injection rate or switch fuel supply to low-sulfur coal blend.</li>";
            }
            if (failedParams.includes("NOX")) {
                advice += "<li>Calibrate urea/ammonia spray rates in Selective Non-Catalytic Reduction (SNCR) / SCR units.</li>";
                advice += "<li>Check Low-NOx burner configurations and adjust overfire air dampers to optimize combustion.</li>";
            }
            advice += "</ul>";
            aiMitigationContent.innerHTML = advice;
        } else {
            // Compliant
            auditBanner.className = "status-banner success";
            auditBanner.querySelector(".banner-icon").innerHTML = '<i class="fa-solid fa-circle-check"></i>';
            auditTitle.textContent = "All Emissions Compliant";
            auditDesc.textContent = "Stack parameters satisfy all Central Pollution Control Board statutory guidelines.";

            if (dashStackStatus) {
                dashStackStatus.textContent = "Compliant";
                dashStackStatus.className = "stat-value text-success";
            }

            aiMitigationContent.innerHTML = "<p><i class='fa-solid fa-sparkles text-accent'></i> Plant operates within safe parameters. Continue standard continuous emission monitoring system (CEMS) telemetry transmissions to SPCB and CPCB servers.</p>";
        }

        // Update overall eco-score mock logic
        let score = 95;
        if (hasExceedance) score -= 30;
        if (state.gis.nearestDistance < 10) score -= 15;
        document.getElementById("dash-eco-score").textContent = `${score} / 100`;
    }

    // ==========================================
    // 4. GIS PROXIMITY SCREENER & LEAFLET MAP
    // ==========================================
    let leafletMap;
    let projectMarker;
    let closestParkMarker;
    let bufferCircle;
    let connectingLine;

    function initMap() {
        // Center of India coordinates
        leafletMap = L.map('map', {
            zoomControl: true,
            scrollWheelZoom: false
        }).setView([20.5937, 78.9629], 5);

        // Dark-mode Map layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(leafletMap);
    }

    // Compute Haversine distance in KM
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    const gisForm = document.getElementById("gis-form");
    const presetBtns = document.querySelectorAll(".preset-btn");

    // Custom protected areas the user adds (sanctuaries/reserves not in the built-in
    // list). Kept separate from `protectedAreas` so the built-in list stays a clean
    // reference set, but combined with it at check time.
    let customProtectedAreas = [];
    let gisAreaCounter = 0;
    const gisAreaNameInput = document.getElementById("gis-custom-area-name");
    const gisAreaLatInput = document.getElementById("gis-custom-area-lat");
    const gisAreaLngInput = document.getElementById("gis-custom-area-lng");
    const addGisAreaBtn = document.getElementById("btn-add-gis-area");
    const gisAreasListEl = document.getElementById("gis-custom-areas-list");

    function renderGisAreasList() {
        if (!gisAreasListEl) return;
        gisAreasListEl.innerHTML = customProtectedAreas.length
            ? customProtectedAreas.map(a => `
                <span class="authority-chip" data-id="${a.id}" style="display:inline-flex; align-items:center; gap:6px; background:rgba(79,122,99,0.14); border:1px solid var(--border-glass); border-radius:20px; padding:4px 6px 4px 12px; font-size:11px; color:var(--text-primary);">
                    <strong>${a.name}</strong>&nbsp;&middot;&nbsp;${a.lat.toFixed(4)}, ${a.lng.toFixed(4)}
                    <button type="button" class="gis-area-remove-btn" data-id="${a.id}" title="Remove" style="background:none; border:none; color:var(--text-dim); cursor:pointer; font-size:13px; line-height:1; padding:2px 4px;">&times;</button>
                </span>`).join("")
            : `<span style="font-size:11px; color:var(--text-dim);">No custom areas added &mdash; only the built-in list is checked.</span>`;

        gisAreasListEl.querySelectorAll(".gis-area-remove-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                customProtectedAreas = customProtectedAreas.filter(a => String(a.id) !== btn.dataset.id);
                renderGisAreasList();
            });
        });
    }

    if (addGisAreaBtn) {
        addGisAreaBtn.addEventListener("click", () => {
            const name = gisAreaNameInput ? gisAreaNameInput.value.trim() : "";
            const lat = gisAreaLatInput ? parseFloat(gisAreaLatInput.value) : NaN;
            const lng = gisAreaLngInput ? parseFloat(gisAreaLngInput.value) : NaN;
            if (!name || isNaN(lat) || isNaN(lng)) {
                alert("Enter a name, latitude, and longitude before adding a protected area.");
                return;
            }
            gisAreaCounter += 1;
            customProtectedAreas.push({ id: gisAreaCounter, name, lat, lng });
            if (gisAreaNameInput) gisAreaNameInput.value = "";
            if (gisAreaLatInput) gisAreaLatInput.value = "";
            if (gisAreaLngInput) gisAreaLngInput.value = "";
            renderGisAreasList();
        });
    }
    renderGisAreasList();

    presetBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const lat = Number(btn.getAttribute("data-lat"));
            const lng = Number(btn.getAttribute("data-lng"));
            const name = btn.getAttribute("data-name");

            document.getElementById("project-name").value = name;
            document.getElementById("project-lat").value = lat;
            document.getElementById("project-lng").value = lng;

            runGisScreener(lat, lng, name);
        });
    });

    gisForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const lat = Number(document.getElementById("project-lat").value);
        const lng = Number(document.getElementById("project-lng").value);
        const name = document.getElementById("project-name").value;

        runGisScreener(lat, lng, name);
    });

    function runGisScreener(lat, lng, projectName) {
        // Find nearest protected area — combine the built-in reference list with
        // whatever custom sanctuaries/reserves the user has added, so a site near an
        // area that isn't in the built-in shortlist still gets a real proximity check
        // instead of being silently compared only against unrelated parks.
        let nearestPark = null;
        let minDistance = Infinity;
        const allAreas = protectedAreas.concat(customProtectedAreas);

        allAreas.forEach(park => {
            const dist = calculateDistance(lat, lng, park.lat, park.lng);
            if (dist < minDistance) {
                minDistance = dist;
                nearestPark = park;
            }
        });

        // Save to state
        state.gis.projectName = projectName;
        state.gis.lat = lat;
        state.gis.lng = lng;
        state.gis.nearestParkName = nearestPark.name;
        state.gis.nearestDistance = minDistance;

        // Calculate verdict
        let verdictText = "";
        let badgeClass = "";
        let alertDescText = "";

        if (minDistance < 10) {
            verdictText = "Warning: Within 10km Buffer";
            badgeClass = "compliance-badge badge-warning";
            alertDescText = `<i class="fa-solid fa-circle-exclamation"></i>
                            <span>Warning: Since the site is located within the 10km Eco-Sensitive Zone boundary of <strong>${nearestPark.name}</strong>, direct clearances must be obtained from the Standing Committee of the National Board for Wildlife (NBWL) under the PARIVESH system. Baseline study and monitoring reports must be attached.</span>`;
        } else {
            verdictText = "Compliant: Safe Proximity";
            badgeClass = "compliance-badge badge-success";
            alertDescText = `<i class="fa-solid fa-circle-check"></i>
                            <span>Safe: Project location exceeds the 10km statutory buffer threshold. Standard environment clearances are appraised via local State SEIAA or Central MoEF&CC committee routes. No additional NBWL clearance triggers.</span>`;
        }

        // Update UI
        document.getElementById("gis-dist-val").textContent = `${minDistance.toFixed(2)} km`;
        document.getElementById("gis-park-val").textContent = nearestPark.name;

        const verdictBadge = document.getElementById("gis-verdict-badge");
        verdictBadge.textContent = verdictText;
        verdictBadge.className = badgeClass;

        document.getElementById("gis-alert-desc").innerHTML = alertDescText;

        // Update Dashboard Summary Stats Card
        const dashBuffer = document.getElementById("dash-buffer-status");
        if (dashBuffer) {
            dashBuffer.textContent = `${minDistance.toFixed(1)} km (${minDistance < 10 ? 'Warning' : 'Safe'})`;
            dashBuffer.className = `stat-value ${minDistance < 10 ? 'text-warning' : 'text-success'}`;
        }

        // Draw on map
        updateMapVisuals(lat, lng, projectName, nearestPark, minDistance);
    }

    function updateMapVisuals(lat, lng, projectName, park, distance) {
        if (!leafletMap) return;

        // Clear existing markers/drawings
        if (projectMarker) leafletMap.removeLayer(projectMarker);
        if (closestParkMarker) leafletMap.removeLayer(closestParkMarker);
        if (bufferCircle) leafletMap.removeLayer(bufferCircle);
        if (connectingLine) leafletMap.removeLayer(connectingLine);

        // Custom green icon for project
        const projectIcon = L.divIcon({
            html: '<div style="background-color: var(--color-primary); width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
            className: 'custom-div-icon',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        // Custom blue icon for park
        const parkIcon = L.divIcon({
            html: '<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
            className: 'custom-div-icon',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        // Add Markers
        projectMarker = L.marker([lat, lng], { icon: projectIcon })
            .bindPopup(`<strong>${projectName}</strong><br>Latitude: ${lat}<br>Longitude: ${lng}`)
            .addTo(leafletMap);

        closestParkMarker = L.marker([park.lat, park.lng], { icon: parkIcon })
            .bindPopup(`<strong>${park.name}</strong><br>${park.state}`)
            .addTo(leafletMap);

        // Add 10km Buffer Circle around the protected park
        bufferCircle = L.circle([park.lat, park.lng], {
            color: 'var(--color-warning)',
            fillColor: 'var(--color-warning)',
            fillOpacity: 0.15,
            radius: 10000, // 10 km in meters
            dashArray: "5, 5"
        }).addTo(leafletMap);

        // Draw connecting line between site and park
        connectingLine = L.polyline([[lat, lng], [park.lat, park.lng]], {
            color: 'rgba(255, 255, 255, 0.4)',
            weight: 2,
            dashArray: '4, 8'
        }).bindTooltip(`Distance: ${distance.toFixed(2)} km`, { permanent: true, direction: 'center', className: 'map-tooltip-dark' })
            .addTo(leafletMap);

        // Adjust map bounds to show both markers comfortably
        const group = new L.featureGroup([projectMarker, closestParkMarker, bufferCircle]);
        leafletMap.fitBounds(group.getBounds().pad(0.2));
    }

    // ==========================================
    // 5. PROJECT CATEGORIZATION WIZARD ROUTINE
    // ==========================================
    let currentWizardStep = 1;
    const wizardPanels = document.querySelectorAll(".wizard-panel");
    const stepIndicators = document.querySelectorAll(".wizard-stepper .step");
    const nextButtons = document.querySelectorAll(".btn-next");
    const prevButtons = document.querySelectorAll(".btn-prev");
    const sectorCards = document.querySelectorAll(".sector-card");
    let selectedSector = "mining";

    // Sector Selection Change
    sectorCards.forEach(card => {
        card.addEventListener("click", () => {
            sectorCards.forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            selectedSector = card.getAttribute("data-sector");

            // Toggle corresponding size thresholds input
            document.querySelectorAll(".dynamic-size-group").forEach(group => {
                group.classList.add("hidden");
            });
            document.getElementById(`size-${selectedSector}`).classList.remove("hidden");

            // Show the manual classification override fields only in manual mode
            const manualPanel = document.getElementById("manual-classification-panel");
            if (manualPanel) manualPanel.classList.toggle("hidden", selectedSector !== "manual");

            const predictBtnLabel = document.getElementById("btn-predict-category");
            if (predictBtnLabel) {
                predictBtnLabel.innerHTML = selectedSector === "manual"
                    ? 'Apply Manual Classification <i class="fa-solid fa-check"></i>'
                    : 'Predict Compliance Category <i class="fa-solid fa-bolt"></i>';
            }
        });
    });

    nextButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const nextStep = Number(btn.getAttribute("data-next"));
            goToWizardStep(nextStep);
        });
    });

    prevButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const prevStep = Number(btn.getAttribute("data-prev"));
            goToWizardStep(prevStep);
        });
    });

    function goToWizardStep(step) {
        currentWizardStep = step;

        wizardPanels.forEach(panel => {
            panel.classList.remove("active");
        });
        document.getElementById(`wizard-step-${step}`).classList.add("active");

        // Update stepper indicators
        stepIndicators.forEach((indicator, index) => {
            indicator.classList.remove("active", "completed");
            const stepNum = index + 1;
            if (stepNum < step) {
                indicator.classList.add("completed");
            } else if (stepNum === step) {
                indicator.classList.add("active");
            }
        });
    }

    // Wizard Prediction Click
    const predictBtn = document.getElementById("btn-predict-category");
    if (predictBtn) {
        predictBtn.addEventListener("click", () => {
            runCategorizationLogic();
        });
    }

    function runCategorizationLogic() {
        const isInterstate = document.getElementById("check-interstate").checked;
        const isProtected = document.getElementById("check-protected").checked;
        const isCPA = document.getElementById("check-critically-polluted").checked;

        let category = "Category B2"; // Default baseline
        let authority = "State Environmental Impact Assessment Authority (SEIAA) / SEAC";
        let eia = "No. Standardized environmental conditions applied. Simplified screening. No EIA required.";
        let reasons = [];

        // ---- Manual mode: skip all computed thresholds, use the user's own entries ----
        if (selectedSector === "manual") {
            const manualCategorySelect = document.getElementById("manual-category-select");
            const manualAuthorityInput = document.getElementById("manual-authority-input");
            const manualEiaInput = document.getElementById("manual-eia-input");
            const manualNotesInput = document.getElementById("manual-notes-input");

            category = manualCategorySelect ? manualCategorySelect.value : "Category B2";
            authority = (manualAuthorityInput && manualAuthorityInput.value.trim())
                ? manualAuthorityInput.value.trim()
                : "Not specified \u2014 confirm the appraisal authority with SEIAA/MoEF&CC.";
            eia = (manualEiaInput && manualEiaInput.value.trim())
                ? manualEiaInput.value.trim()
                : "Not specified \u2014 confirm EIA/public hearing requirements against the applicable notification.";

            reasons.push("Project type set to <strong>Other / Manual Classification</strong> \u2014 no auto-computed size threshold was applied.");
            reasons.push(`Category set manually: ${category}.`);
            if (manualNotesInput && manualNotesInput.value.trim()) {
                reasons.push(escapeHtmlBasic(manualNotesInput.value.trim()));
            }

            const hasSensitivity = isInterstate || isProtected || isCPA;
            if (hasSensitivity) {
                reasons.push("<strong>Site sensitivity flags noted:</strong>");
                if (isInterstate) reasons.push("- Interstate or International border within 15 km.");
                if (isProtected) reasons.push("- National Park or Sanctuary boundary within 10 km.");
                if (isCPA) reasons.push("- Located in a Critically Polluted Area.");
                reasons.push("Note: since this is a manual classification, General Conditions were <em>not</em> auto-applied \u2014 review whether they should upgrade the category yourself.");
            }

            state.classification.category = category;
            state.classification.authority = authority;
            state.classification.eiaRequired = eia;
            state.classification.reasons = reasons;

            renderClassificationVerdict(category, authority, eia, reasons);
            return;
        }

        if (selectedSector === "mining") {
            const area = Number(document.getElementById("mining-lease-area").value) || 0;
            const mineralType = document.querySelector("input[name='mineral-type']:checked").value;

            reasons.push(`Sector type identified: Mineral Mining (${mineralType === 'major' ? 'Major Mineral' : 'Minor Mineral'}).`);
            reasons.push(`Lease area proposed: ${area} Hectares.`);

            if (area > 100) {
                category = "Category A";
                reasons.push("Mining lease area is greater than 100 Ha, classification automatically triggers Central appraisal.");
            } else if (area >= 5) {
                category = "Category B1";
                reasons.push("Mining lease area is between 5 and 100 Ha, matching State appraisal with EIA requirements.");
            } else {
                category = "Category B2";
                reasons.push("Mining lease area is less than 5 Ha, qualifying for simplified state-level clearance.");
            }
        }
        else if (selectedSector === "power") {
            const cap = Number(document.getElementById("power-capacity").value) || 0;
            const fuel = document.querySelector("input[name='power-fuel']:checked").value;

            reasons.push(`Sector type: Thermal Power Plants (Fuel source: ${fuel.toUpperCase()}).`);
            reasons.push(`Generation capacity: ${cap} Megawatts (MW).`);

            if (cap >= 500) {
                category = "Category A";
                reasons.push("Plant capacity meets/exceeds 500 MW threshold limits.");
            } else if (cap >= 50) {
                category = "Category B1";
                reasons.push("Plant capacity is between 50 MW and 500 MW limits.");
            } else {
                category = "Category B2";
                reasons.push("Generation capacity is less than 50 MW threshold.");
            }
        }
        else if (selectedSector === "cement") {
            const capacity = Number(document.getElementById("cement-capacity").value) || 0;
            reasons.push("Sector type: Cement Manufacturing.");
            reasons.push(`Production rate: ${capacity} MTPA (Million Tons Per Annum).`);

            if (capacity >= 1.0) {
                category = "Category B1";
                reasons.push("Production threshold &gt;= 1.0 MTPA requires State appraisal with EIA.");
            } else {
                category = "Category B2";
                reasons.push("Clinker grinding unit is less than 1.0 MTPA capacity, qualifying for simplified screening.");
            }
        }
        else if (selectedSector === "infrastructure") {
            const builtArea = Number(document.getElementById("infra-built-area").value) || 0;
            reasons.push("Sector type: Building & Infrastructure Townships.");
            reasons.push(`Built-up area: ${builtArea.toLocaleString()} sq. meters.`);

            if (builtArea >= 150000) {
                category = "Category B1";
                reasons.push("Built-up area is greater than 1,50,000 sq.m boundary.");
            } else {
                category = "Category B2";
                reasons.push("Built-up area is between 20,000 and 1,50,000 sq.m, satisfying Category B2 limits.");
            }
        }

        // Apply General Conditions (Sensitivity upgrades)
        const hasSensitivity = isInterstate || isProtected || isCPA;
        if (hasSensitivity) {
            reasons.push("<strong>EIA Notification General Conditions triggered:</strong>");
            if (isInterstate) reasons.push("- Interstate or International border within 15 km.");
            if (isProtected) reasons.push("- National Park or Sanctuary boundary within 10 km.");
            if (isCPA) reasons.push("- Located in a Critically Polluted Area.");

            if (category === "Category B1" || category === "Category B2") {
                category = "Category A";
                reasons.push("<strong>Verdict Upgrade:</strong> Under S.O. 1533, triggering General Conditions automatically upgrades state-level B projects to National <strong>Category A</strong>.");
            }
        }

        // Final specifications depending on Category assignment
        if (category === "Category A") {
            authority = "Ministry of Environment, Forest and Climate Change (MoEF&CC), Central EAC";
            eia = "Yes. Compulsory Environmental Impact Assessment study, monitoring, public hearing, and Central appraisal required.";
        } else if (category === "Category B1") {
            authority = "State Environmental Impact Assessment Authority (SEIAA) & SEAC";
            eia = "Yes. Environmental Impact Assessment study, Public Hearing, and State-level appraisal required.";
        } else {
            authority = "State Environmental Impact Assessment Authority (SEIAA) - Screening Route";
            eia = "No. Standardized environmental conditions applied. Public consultation exempted under Category B2 guidelines.";
        }

        // Save values in state
        state.classification.category = category;
        state.classification.authority = authority;
        state.classification.eiaRequired = eia;
        state.classification.reasons = reasons;

        renderClassificationVerdict(category, authority, eia, reasons);
    }

    // Basic HTML escaper for free-text notes rendered into the reasons list
    function escapeHtmlBasic(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    // Shared verdict rendering — used by both the auto-computed sectors and the
    // Other/Manual classification path so the summary panel behaves identically.
    function renderClassificationVerdict(category, authority, eia, reasons) {
        document.getElementById("verdict-class-title").textContent = category;
        document.getElementById("verdict-authority").textContent = authority;
        document.getElementById("verdict-eia").textContent = eia;

        const classIcon = document.getElementById("verdict-class-icon");
        if (category === "Category A") {
            classIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            classIcon.style.background = 'rgba(181, 72, 47, 0.15)';
            classIcon.style.color = 'var(--color-danger)';
            classIcon.style.borderColor = 'rgba(181, 72, 47, 0.25)';
        } else if (category === "Category B1") {
            classIcon.innerHTML = '<i class="fa-solid fa-tags"></i>';
            classIcon.style.background = 'rgba(245, 158, 11, 0.15)';
            classIcon.style.color = 'var(--color-warning)';
            classIcon.style.borderColor = 'rgba(245, 158, 11, 0.25)';
        } else {
            classIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
            classIcon.style.background = 'rgba(191, 138, 61, 0.15)';
            classIcon.style.color = 'var(--color-success)';
            classIcon.style.borderColor = 'rgba(191, 138, 61, 0.25)';
        }

        const reasonsList = document.getElementById("verdict-reasons-list");
        reasonsList.innerHTML = "";
        reasons.forEach(r => {
            reasonsList.insertAdjacentHTML("beforeend", `<li>${r}</li>`);
        });
    }

    // ==========================================
    // STATE POLLUTION CONTROL BOARD (SPCB) NORMS MANAGER
    // ==========================================
    // This is a personal, editable reference table — not a claim that these figures are
    // an official published state-wide standard. Every cell defaults to the CPCB Schedule
    // VI value (tagged "CPCB"); where the user knows the actual figure from a specific
    // consent order or state notification, they enter it and it's tagged "Override" and
    // saved in this browser (localStorage) so it's there next time without re-typing it.
    // Since this app runs as a standalone local file (not inside the Claude.ai Artifacts
    // sandbox), localStorage is the right persistence choice here.
    const SN_STORAGE_KEY = "parivesh_state_norms_overrides_v1";
    const SN_CUSTOM_BOARDS_KEY = "parivesh_state_norms_custom_boards_v1";

    const SN_BUILTIN_BOARDS = [
        { key: "cpcb", short: "CPCB", region: "Central / All India", full: "Central Pollution Control Board (CPCB)" },
        { key: "gpcb", short: "GPCB", region: "Gujarat", full: "Gujarat Pollution Control Board (GPCB)" },
        { key: "mpcb", short: "MPCB", region: "Maharashtra", full: "Maharashtra Pollution Control Board (MPCB)" },
        { key: "uppcb", short: "UPPCB", region: "Uttar Pradesh", full: "Uttar Pradesh Pollution Control Board (UPPCB)" },
        { key: "tnpcb", short: "TNPCB", region: "Tamil Nadu", full: "Tamil Nadu Pollution Control Board (TNPCB)" },
        { key: "wbpcb", short: "WBPCB", region: "West Bengal", full: "West Bengal Pollution Control Board (WBPCB)" },
        { key: "kspcb", short: "KSPCB", region: "Karnataka", full: "Karnataka State Pollution Control Board (KSPCB)" },
        { key: "rpcb", short: "RPCB", region: "Rajasthan", full: "Rajasthan Pollution Control Board (RPCB)" },
        { key: "dpcc", short: "DPCC", region: "Delhi NCR", full: "Delhi Pollution Control Committee (DPCC)" },
        { key: "appcb-tspcb", short: "APPCB/TSPCB", region: "AP / Telangana", full: "Andhra Pradesh / Telangana Pollution Control Board (APPCB/TSPCB)" }
    ];

    let snCustomBoards = [];  // user-added boards: { key, short, region, full }
    let snOverrides = {};     // { boardKey: { industryKey: { pm, so2, nox, co } } }
    let snSelectedBoard = "cpcb";
    let snEditMode = false;

    function snLoadFromStorage() {
        try {
            const raw = localStorage.getItem(SN_STORAGE_KEY);
            snOverrides = raw ? JSON.parse(raw) : {};
        } catch (e) { snOverrides = {}; }
        try {
            const rawBoards = localStorage.getItem(SN_CUSTOM_BOARDS_KEY);
            snCustomBoards = rawBoards ? JSON.parse(rawBoards) : [];
        } catch (e) { snCustomBoards = []; }
    }
    function snSaveOverrides() {
        try { localStorage.setItem(SN_STORAGE_KEY, JSON.stringify(snOverrides)); } catch (e) { /* storage unavailable */ }
    }
    function snSaveCustomBoards() {
        try { localStorage.setItem(SN_CUSTOM_BOARDS_KEY, JSON.stringify(snCustomBoards)); } catch (e) { /* storage unavailable */ }
    }
    function snAllBoards() {
        return SN_BUILTIN_BOARDS.concat(snCustomBoards);
    }

    function snRenderBoardList() {
        const el = document.getElementById("sn-board-list");
        if (!el) return;
        el.innerHTML = snAllBoards().map(b => `
            <button type="button" class="sn-board-btn ${b.key === snSelectedBoard ? "active" : ""}" data-key="${b.key}">
                <strong>${escapeHtmlBasic(b.short)}</strong><span>${escapeHtmlBasic(b.region)}</span>
            </button>
        `).join("");
        el.querySelectorAll(".sn-board-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                snSelectedBoard = btn.dataset.key;
                snEditMode = false;
                const editBtn = document.getElementById("btn-sn-edit-toggle");
                if (editBtn) editBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Edit State Overrides';
                snRenderBoardList();
                snRenderTable();
            });
        });
    }

    function snGetEffective(boardKey, industryKey, param) {
        const override = snOverrides[boardKey] && snOverrides[boardKey][industryKey]
            ? snOverrides[boardKey][industryKey][param] : null;
        if (override != null && override !== "") return { value: override, source: "override" };
        const base = emissionStandards[industryKey] ? emissionStandards[industryKey].limits[param] : null;
        return { value: base, source: "cpcb" };
    }

    function snRenderTable() {
        const board = snAllBoards().find(b => b.key === snSelectedBoard) || SN_BUILTIN_BOARDS[0];
        const titleEl = document.getElementById("sn-board-title");
        const descEl = document.getElementById("sn-board-desc");
        if (titleEl) titleEl.textContent = board.full;
        if (descEl) {
            descEl.textContent = board.key === "cpcb"
                ? "National baseline standard under Schedule VI (EPA, 1986)."
                : `Your saved reference thresholds for ${board.region}, overriding CPCB norms where you've entered a known figure.`;
        }

        const industries = Object.keys(emissionStandards).filter(k => k !== "custom-other");
        const tbody = document.getElementById("sn-table-body");
        if (!tbody) return;

        tbody.innerHTML = industries.map(indKey => {
            const spec = emissionStandards[indKey];
            const cells = ["pm", "so2", "nox", "co"].map(param => {
                const eff = snGetEffective(snSelectedBoard, indKey, param);
                if (snEditMode) {
                    const val = eff.value != null ? eff.value : "";
                    return `<td style="padding: 8px 10px;"><input type="number" step="0.1" class="form-control sn-edit-input" data-industry="${indKey}" data-param="${param}" value="${val}" placeholder="N/A" style="width: 90px; padding: 6px 8px; font-size: 12.5px;"></td>`;
                }
                if (eff.value == null) return `<td style="padding: 10px 14px; color: var(--text-dim);">N/A</td>`;
                const isOverride = eff.source === "override";
                return `<td style="padding: 10px 14px;"><span style="color:${isOverride ? "#e2734f" : "var(--text-primary)"}; font-weight:600;">${eff.value}</span> <span style="color:${isOverride ? "#e2734f" : "var(--text-dim)"}; font-size:11px;">(${isOverride ? "Override" : "CPCB"})</span></td>`;
            }).join("");
            return `<tr style="border-top: 1px solid var(--border-glass);">
                <td style="padding: 10px 14px; font-weight:600;">${escapeHtmlBasic(spec.name)}</td>
                ${cells}
            </tr>`;
        }).join("");
    }

    function snCommitEditInputs() {
        document.querySelectorAll(".sn-edit-input").forEach(input => {
            const indKey = input.dataset.industry;
            const param = input.dataset.param;
            const raw = input.value.trim();
            const base = emissionStandards[indKey].limits[param];
            if (!snOverrides[snSelectedBoard]) snOverrides[snSelectedBoard] = {};
            if (!snOverrides[snSelectedBoard][indKey]) snOverrides[snSelectedBoard][indKey] = {};
            if (raw === "") {
                delete snOverrides[snSelectedBoard][indKey][param];
            } else {
                const num = parseFloat(raw);
                if (!isNaN(num)) {
                    // Typing back the same number as the CPCB default shouldn't be
                    // tagged/stored as an "override" — only a genuine difference is.
                    if (base != null && num === base) {
                        delete snOverrides[snSelectedBoard][indKey][param];
                    } else {
                        snOverrides[snSelectedBoard][indKey][param] = num;
                    }
                }
            }
        });
        snSaveOverrides();
    }

    function snToggleEditMode() {
        if (snEditMode) snCommitEditInputs(); // leaving edit mode — persist what was typed
        snEditMode = !snEditMode;
        const btn = document.getElementById("btn-sn-edit-toggle");
        if (btn) {
            btn.innerHTML = snEditMode
                ? '<i class="fa-solid fa-floppy-disk"></i> Save State Overrides'
                : '<i class="fa-solid fa-pen"></i> Edit State Overrides';
        }
        snRenderTable();
    }

    const snEditToggleBtn = document.getElementById("btn-sn-edit-toggle");
    if (snEditToggleBtn) snEditToggleBtn.addEventListener("click", snToggleEditMode);

    const snRefreshBtn = document.getElementById("btn-sn-refresh");
    if (snRefreshBtn) {
        snRefreshBtn.addEventListener("click", () => {
            snLoadFromStorage();
            snRenderBoardList();
            snRenderTable();
        });
    }

    const snAddBoardBtn = document.getElementById("btn-sn-add-board");
    if (snAddBoardBtn) {
        snAddBoardBtn.addEventListener("click", () => {
            const name = prompt('Short name for the new board (e.g. "HSPCB"):');
            if (!name || !name.trim()) return;
            const region = prompt('State/region (e.g. "Haryana"):') || "";
            const key = "custom-" + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
            snCustomBoards.push({
                key,
                short: name.trim(),
                region: region.trim(),
                full: `${name.trim()}${region.trim() ? " (" + region.trim() + ")" : ""}`
            });
            snSaveCustomBoards();
            snSelectedBoard = key;
            snEditMode = false;
            snRenderBoardList();
            snRenderTable();
        });
    }

    snLoadFromStorage();
    snRenderBoardList();
    snRenderTable();

    // Sync Categorization to Dashboard Summary Panel
    const syncDashboardBtn = document.getElementById("btn-sync-dashboard");
    if (syncDashboardBtn) {
        syncDashboardBtn.addEventListener("click", () => {
            const dashCat = document.getElementById("dash-category-status");
            if (dashCat) {
                dashCat.textContent = state.classification.category;
                if (state.classification.category === "Category A") {
                    dashCat.className = "stat-value text-danger";
                } else if (state.classification.category === "Category B1") {
                    dashCat.className = "stat-value text-warning";
                } else {
                    dashCat.className = "stat-value text-success";
                }
            }

            // Redirect to dashboard tab
            const dashTabBtn = document.querySelector(".sidebar-nav li[data-tab='dashboard']");
            if (dashTabBtn) {
                dashTabBtn.click();
            }
        });
    }

    // Reset Wizard Flow
    const resetWizardBtn = document.getElementById("btn-reset-wizard");
    if (resetWizardBtn) {
        resetWizardBtn.addEventListener("click", () => {
            goToWizardStep(1);
            document.getElementById("check-interstate").checked = false;
            document.getElementById("check-protected").checked = false;
            document.getElementById("check-critically-polluted").checked = false;
        });
    }

    // ==========================================
    // 6. REGULATIONS KNOWLEDGE BASE SEARCH
    // ==========================================
    const regSearchInput = document.getElementById("reg-search-input");
    const regCards = document.querySelectorAll("#reg-cards-container .reg-card");

    if (regSearchInput) {
        regSearchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();

            regCards.forEach(card => {
                const keywords = card.getAttribute("data-title");
                if (keywords.includes(query)) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });
        });
    }

    // ==========================================
    // 7. MULTI-PDF COMPLIANCE AUDITOR
    // ==========================================
    (function initPdfAuditor() {
        const uploadZone = document.getElementById("pdf-upload-zone");
        const fileInput = document.getElementById("pdf-file-input");
        const queueContainer = document.getElementById("pdf-queue-container");
        const industrySelect = document.getElementById("pdf-industry-select");
        const authorityAddSelect = document.getElementById("pdf-authority-add-select");
        const authorityChipsEl = document.getElementById("pdf-authority-chips");
        const authorityNotesEl = document.getElementById("pdf-authority-notes");
        let selectedAuthorities = ["cpcb"]; // default selection
        const overridePmInput = document.getElementById("pdf-override-pm");
        const overridePm25Input = document.getElementById("pdf-override-pm25");
        const overrideSo2Input = document.getElementById("pdf-override-so2");
        const overrideNoxInput = document.getElementById("pdf-override-nox");
        const overrideCoInput = document.getElementById("pdf-override-co");

        // Custom parameters (any chemical / water / air reading beyond the built-in 4)
        const customParamNameInput = document.getElementById("custom-param-name");
        const customParamCategorySelect = document.getElementById("custom-param-category");
        const customParamUnitInput = document.getElementById("custom-param-unit");
        const customParamLimitInput = document.getElementById("custom-param-limit");
        const addCustomParamBtnTop = document.getElementById("btn-add-custom-param-top");
        const customParamsListEl = document.getElementById("custom-params-list");
        let customParams = []; // { id, name, category, unit, limit }
        let customParamCounter = 0;
        const clearBtn = document.getElementById("btn-clear-reports");
        const refreshBtn = document.getElementById("btn-refresh-audit");
        const mockBtn = document.getElementById("btn-generate-mock-pdf");
        const mockCompliantBtn = document.getElementById("btn-generate-mock-pdf-compliant");

        const placeholder = document.getElementById("pdf-report-placeholder");
        const reportDetails = document.getElementById("pdf-report-details");
        const companyNameEl = document.getElementById("report-company-name");
        const filenameEl = document.getElementById("report-filename");
        const industryEl = document.getElementById("report-industry-type");
        const pageCountEl = document.getElementById("report-page-count");
        const authorityEl = document.getElementById("report-authority");
        const effectiveLimitsEl = document.getElementById("report-effective-limits");

        // PDF page preview controls
        const previewSection = document.getElementById("pdf-preview-section");
        const previewCanvas = document.getElementById("pdf-preview-canvas");
        const previewPageLabel = document.getElementById("pdf-preview-page-label");
        const previewPrevBtn = document.getElementById("pdf-preview-prev");
        const previewNextBtn = document.getElementById("pdf-preview-next");
        const previewCloseBtn = document.getElementById("pdf-preview-close");
        const previewJumpInput = document.getElementById("pdf-preview-jump-input");
        const previewJumpBtn = document.getElementById("pdf-preview-jump-btn");
        const previewFlaggedPagesEl = document.getElementById("pdf-preview-flagged-pages");
        const previewPageIssuesEl = document.getElementById("pdf-preview-page-issues");
        const viewAllPagesBtn = document.getElementById("btn-view-all-pages");
        let previewPdfDoc = null;
        let previewCurrentPage = 1;
        let previewActiveDoc = null;
        const bannerEl = document.getElementById("pdf-report-banner");
        const bannerIconEl = bannerEl ? bannerEl.querySelector(".banner-icon i") : null;
        const bannerTitleEl = document.getElementById("pdf-banner-title");
        const bannerDescEl = document.getElementById("pdf-banner-desc");
        const violationsTbody = document.getElementById("pdf-violations-tbody");
        const violationsSection = document.getElementById("pdf-violations-section");

        // Proponent Name Verification controls & results
        const expectedCompanyInput = document.getElementById("pdf-expected-company");
        const companyAliasesInput = document.getElementById("pdf-company-aliases");
        const companyPageRangeInput = document.getElementById("pdf-company-page-range");
        const companyCheckSection = document.getElementById("pdf-company-check-section");
        const companyCheckSummaryEl = document.getElementById("company-check-summary");
        const companyCheckTbody = document.getElementById("company-check-tbody");

        // Guard: only run if the PDF Auditor markup is present on this page
        if (!uploadZone || !fileInput || !queueContainer) return;

        let docCounter = 0;
        const auditedDocs = {}; // docId -> { name, industryKey, industryName, totalPages, companyName, violations, status }
        let activeDocId = null;

        // ---- Parameter detection patterns (tolerant of spacing/case variants) ----
        // Strategy A: narrative sentence form, e.g. "PM levels were recorded at 245 mg/Nm3"
        // Unit is intentionally optional (many lab reports state the unit once in a column
        // header and never repeat it next to every reading), and the number may come
        // shortly before OR after the parameter keyword to handle both phrasings.
        const UNIT_FRAG = "(?:mg\\s?\\/?\\s?n?m3?|mg\\s?\\/?\\s?m3|\u00b5g\\s?\\/?\\s?n?m3?)?";
        const paramPatterns = {
            pm: { label: "Particulate Matter (PM / PM10)", regex: new RegExp("\\b(?:particulate matter|pm\\s?10|pm)\\b[^0-9\\n]{0,40}?(\\d+(?:\\.\\d+)?)\\s?" + UNIT_FRAG, "i") },
            pm25: { label: "Particulate Matter (PM2.5)", regex: new RegExp("\\bpm\\s?2\\.5\\b[^0-9\\n]{0,40}?(\\d+(?:\\.\\d+)?)\\s?" + UNIT_FRAG, "i") },
            so2: { label: "Sulphur Dioxide (SO\u2082)", regex: new RegExp("\\b(?:so\\s?2|sulphur dioxide|sulfur dioxide)\\b[^0-9\\n]{0,40}?(\\d+(?:\\.\\d+)?)\\s?" + UNIT_FRAG, "i") },
            nox: { label: "Oxides of Nitrogen (NOx / NO\u2082)", regex: new RegExp("\\b(?:nox|oxides of nitrogen|nitrogen oxides|nitrogen dioxide|no\\s?2)\\b[^0-9\\n]{0,40}?(\\d+(?:\\.\\d+)?)\\s?" + UNIT_FRAG, "i") },
            co: { label: "Carbon Monoxide (CO)", regex: new RegExp("\\b(?:carbon monoxide|CO)\\b[^0-9\\n]{0,40}?(\\d+(?:\\.\\d+)?)\\s?" + UNIT_FRAG, "i") }
        };

        // Strategy B/C/D support: bare keyword (no unit/number required) for locating a
        // parameter's row in a table, plus keyword regexes for "actual/observed" vs
        // "standard/permissible" columns so the reading closest to the right keyword wins.
        //
        // PM2.5 gets its own key/limit rather than sharing "pm" — ambient air reports
        // routinely test PM10 and PM2.5 as two separate rows against two different NAAQS
        // limits, and a report row for one mentioning "Particulate Matter (PM2.5)" also
        // contains the generic phrase "particulate matter", which used to make it match
        // (and get compared against) the PM10/generic-PM slot too. PM25_MARKER_RE is used
        // by the scanning loop to make sure a PM2.5 row is only ever checked against the
        // PM2.5 limit, not double-counted against the PM/PM10 one as well.
        const paramKeywordPatterns = {
            pm: /\b(?:particulate matter|pm\s?10|pm)\b/i,
            pm25: /\b(?:pm\s?2\.5|pm2\.5)\b/i,
            so2: /\b(?:so\s?2|sulphur dioxide|sulfur dioxide)\b/i,
            nox: /\b(?:nox|oxides of nitrogen|nitrogen oxides|nitrogen dioxide|no\s?2)\b/i,
            co: /\b(?:carbon monoxide|CO)\b/
        };
        const PM25_MARKER_RE = /\bpm\s?2\.5\b/i;
        const RESULT_KEYWORD_RE = /\b(actual|observed|result|measured|recorded|found|monitored|reading)\b/i;
        const LIMIT_KEYWORD_RE = /\b(standard|permissible|limit|prescribed|norms?)\b/i;

        // A broad "some unit is present" check — much wider than the mg/Nm3-specific
        // UNIT_FRAG above, since this is only used as a confidence signal (not to pull
        // the value itself). Covers common air/water/soil/noise units so genuine
        // narrative readings ("...recorded at 3.2 mg/l") are still accepted.
        const ANY_UNIT_RE = /\b(mg|\u00b5g|ug|ng|ppm|ppb|db\s?\(?a\)?|%|kg|tpd|m3|nm3|mg\/nm3|mg\/m3|\u00b5g\/m3|ug\/m3|mg\/l|\u00b5g\/l|ug\/l)\b/i;

        // Which physical unit a row's numbers are actually in varies a lot by sample
        // type — stack readings are mg/Nm3, ambient-air/workplace readings are commonly
        // \u00b5g/m3 or mg/m3, water/effluent readings are mg/L. Displaying every flagged
        // reading as "mg/Nm\u00b3" regardless of what the report itself says is misleading
        // (e.g. an ambient-air PM10 reading of "110 \u00b5g/m3" would otherwise show up
        // as "110 mg/Nm\u00b3"). This pulls the actual unit text out of the row so the
        // audit table can show it as printed, falling back to the stack-emission default
        // only when no unit could be identified in the line at all.
        const UNIT_DISPLAY_RE = /(mg\s?\/?\s?n\.?\s?m3|\u00b5g\s?\/?\s?n\.?\s?m3|ug\s?\/?\s?n\.?\s?m3|mg\s?\/?\s?m3|\u00b5g\s?\/?\s?m3|ug\s?\/?\s?m3|mg\s?\/?\s?l|\u00b5g\s?\/?\s?l|ug\s?\/?\s?l|ppm|ppb)/i;
        function extractDisplayUnit(line) {
            const m = UNIT_DISPLAY_RE.exec(line || "");
            if (!m) return null;
            let u = m[0].replace(/\s+/g, "").toLowerCase();
            if (/nm3/.test(u)) u = u.replace(/nm3/, "Nm\u00b3");
            else if (/m3/.test(u)) u = u.replace(/m3/, "m\u00b3");
            u = u.replace(/^ug/, "\u00b5g");
            u = u.replace(/\/l$/, "/L");
            return u;
        }

        // ---- Chapter / narrative / table-of-contents guard ----
        // A 589-page EIA is mostly narrative discussion, chapter headings, literature
        // review, and TOC/list-of-tables entries — not actual monitoring data. Those
        // sections routinely mention "PM", "NOx" etc. as topics, and often carry a
        // stray number nearby (a chapter/section/page/year number) that is NOT a
        // reading. This filter recognizes and skips that kind of line outright so
        // only genuine data lines get scanned for exceedances.
        const NON_DATA_LINE_RE = /^\s*(chapter|section|annexure|annex|appendix|table\s+of\s+contents|list\s+of\s+(tables|figures|annexures)|fig(ure)?\.?\s*\d|plate\s*\d)\b/i;
        const DOT_LEADER_RE = /\.{4,}/; // TOC-style dot leaders, e.g. "4.3 Air Environment ..... 78"
        const NUMBERED_HEADING_RE = /^\s*\d+(\.\d+){1,3}\s+[A-Z]/; // e.g. "4.3.2 Ambient Air Quality Standards"

        // ---- Sampling-metadata guard ----
        // A lab report's "SAMPLE DETAILS" block routinely restates a parameter name next
        // to a number that is NOT a concentration reading — e.g. "VOLUME OF AIR SAMPLED :
        // PM10: 552 m3, Other Gas: 0.24 m3" carries "PM10" and "552" with a real unit (m3),
        // which previously passed every other check and got mis-flagged as a 552 mg/Nm3
        // PM exceedance. These sampling/instrumentation fields (air volume drawn through
        // the filter, flow rate, duration, wind, humidity, temperature) live in the same
        // section as the parameter names but never represent the analysis result — only
        // the ANALYSIS/RESULTS table further down the page does. Skip them outright.
        const SAMPLING_METADATA_LINE_RE = /\b(volume\s+of\s+(air\s+)?sampl(ed|ing)|sampl(e|ing)\s+volume|flow\s*rate|duration\s+of\s+sampl(e|ing)|sampl(e|ing)\s+(duration|date|protocol|location|type)|wind\s+(direction|velocity)|average\s+(wind|humidity)|ambient\s+(min|max)?\.?\s*temp|analysis\s+(start|end)\s*date)\b/i;

        function isLikelyHeadingOrTocLine(line) {
            const trimmed = (line || "").trim();
            if (!trimmed) return true;
            if (NON_DATA_LINE_RE.test(trimmed)) return true;
            if (DOT_LEADER_RE.test(trimmed)) return true;
            if (SAMPLING_METADATA_LINE_RE.test(trimmed)) return true;
            // A numbered-heading line is only treated as "not data" if it's short and
            // carries no unit — a real table row can also start with a numeric code,
            // but it will have a unit or several columns of numbers alongside it.
            if (NUMBERED_HEADING_RE.test(trimmed) && trimmed.length < 90 && !ANY_UNIT_RE.test(trimmed)) return true;
            return false;
        }

        // A bare 4-digit integer (1900-2099) with no supporting unit/keyword is almost
        // always a year or a report/notification reference (e.g. "EIA Notification,
        // 2006"), not a concentration reading — reject it as the sole piece of evidence.
        function isBareYearLikeValue(value, line) {
            return Number.isInteger(value) && value >= 1900 && value <= 2099 && !ANY_UNIT_RE.test(line);
        }

        // Build a tolerant, case-insensitive whole-word regex for an arbitrary
        // user-supplied parameter name (e.g. "Fluoride", "BOD", "pH"), used to
        // locate custom chemical/water/air parameters the same way the four
        // built-in parameters are located.
        function buildCustomKeywordRegex(name) {
            const trimmed = (name || "").trim();
            if (!trimmed) return null;
            const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
            try {
                return new RegExp(`\\b${escaped}\\b`, "i");
            } catch (e) {
                return null;
            }
        }

        // Extract every standalone number in a line along with its character index.
        // Numbers glued directly onto a preceding letter (e.g. the "3" in "Nm3"/"m3",
        // the "2" in "SO2", or the "2.5" in "PM2.5") are masked out first — those are
        // part of a unit or parameter-name token, not a numeric reading, and were
        // previously being mis-picked-up as the "measured value" (e.g. "100 mg/Nm3"
        // misread as "3", or "PM2.5" leaking a phantom "5"). Masking with equal-length
        // spaces (rather than just skipping the leading digit) keeps character offsets
        // intact for the keyword-proximity checks below, and correctly removes trailing
        // decimal fragments too.
        //
        // Real PDF text extraction very often inserts a SPACE between a pollutant alias
        // and its number — "PM 10" or "SO 2" instead of "PM10"/"SO2" — depending on font
        // kerning/glyph spacing in the source document. The glued-token mask above only
        // catches the no-space form, so that number was leaking through as a phantom
        // extra column (e.g. "PARTICULATE MATTER (PM 10) mg/m3 1.5 10" was being read as
        // THREE numbers — 10, 1.5, 10 — with the first "10" from the label itself getting
        // mistaken for the actual reading instead of the real result, 1.5).
        const LABEL_ALIAS_WITH_SPACE_RE = /\b(?:pm|so|no)\s(?:2\.5|10|2)\b/gi;

        function extractNumberTokens(line) {
            const cleaned = cleanLineForNumberExtraction(line);
            const masked = cleaned
                .replace(LABEL_ALIAS_WITH_SPACE_RE, (m) => " ".repeat(m.length))
                .replace(/[A-Za-z]+\d+(?:\.\d+)?/g, (m) => " ".repeat(m.length));
            const tokens = [];
            const re = /\d+(?:\.\d+)?/g;
            let m;
            while ((m = re.exec(masked)) !== null) {
                const value = parseFloat(m[0]);
                if (isNaN(value)) continue;
                tokens.push({ value, index: m.index });
            }
            return tokens;
        }

        // Lab-report table rows commonly carry two more numeric traps beyond the
        // actual data columns: a leading Sr. No. ("01.", "02)") and a trailing test
        // method / standard citation ("IS:5182(PART 24) RA2022", "APHA 2320B", ...).
        // Those citation numbers (standard codes, part numbers, revision years) were
        // exactly what got mis-picked-up as the "measured value" by a naive
        // right-most-number guess. Masking them out (same-length space replacement,
        // so character offsets used elsewhere stay valid) leaves just the genuine
        // Result/Limit columns to choose between.
        function cleanLineForNumberExtraction(line) {
            let cleaned = line.replace(/^\s*\d{1,3}[.)]\s+/, (m) => " ".repeat(m.length));
            cleaned = cleaned.replace(/\b(is\s*[:\-]?\s*\d{3,6}|part\s*\d+|ra\s*20\d{2}|apha\b|astm\b|test\s*method)\b.*/i, (m) => " ".repeat(m.length));
            return cleaned;
        }

        // Which column holds the actual reading isn't consistent across report
        // formats — some put "Standard, Actual" (limit first), others put
        // "Result, Norms" (reading first, as in GPCB lab reports). Rather than
        // guessing, this is detected once per document from its own header row
        // (a line containing "Parameter" plus both a result-style and a limit-style
        // column label) and then applied consistently to every data row that
        // follows. Reset per file in auditPdfFile; null until a header is seen.
        let resultColumnIsFirst = null;
        const HEADER_ROW_HINT_RE = /\bparameter\b/i;
        function detectHeaderColumnOrder(line) {
            if (!HEADER_ROW_HINT_RE.test(line)) return;
            const resultMatch = RESULT_KEYWORD_RE.exec(line);
            const limitMatch = LIMIT_KEYWORD_RE.exec(line);
            if (resultMatch && limitMatch) {
                resultColumnIsFirst = resultMatch.index < limitMatch.index;
            }
        }

        // Given a line (and optional lookahead lines) that mentions a parameter, decide the
        // best candidate "measured/actual" value using several tolerant strategies. Returns
        // { value, snippet, nextLineIndex } (nextLineIndex is set only when the value came
        // from a look-ahead line, so the caller can also highlight that source line) or null.
        //
        // Every strategy below requires some piece of corroborating evidence (a unit token,
        // a result/limit keyword, or a second numeric column typical of a table row) before
        // accepting a number as a real reading. A bare number sitting next to a parameter
        // name with none of that evidence is exactly the pattern that misfires on narrative
        // chapters, literature review, and table-of-contents pages in a large EIA report —
        // so it's rejected rather than guessed at.
        function findMeasuredValueForParam(line, nextLines) {
            if (isLikelyHeadingOrTocLine(line)) return null;

            const numbers = extractNumberTokens(line);
            const hasUnit = ANY_UNIT_RE.test(line);
            const hasResultKw = RESULT_KEYWORD_RE.test(line);
            const hasLimitKw = LIMIT_KEYWORD_RE.test(line);

            if (numbers.length > 0) {
                // Strategy B: an explicit "actual/observed/result" keyword pins down which
                // number is the real reading (as opposed to the restated standard/limit).
                // When a limit keyword is ALSO present on the same line, the number nearest
                // it is the report's own printed limit for this exact row — e.g. "Result:
                // 45 mg/Nm3, Standard: 50 mg/Nm3" — and is trustworthy enough to use in
                // place of the generic industry default.
                const resultMatch = RESULT_KEYWORD_RE.exec(line);
                const limitMatchB = LIMIT_KEYWORD_RE.exec(line);
                if (resultMatch) {
                    const after = numbers.filter(n => n.index > resultMatch.index);
                    const before = numbers.filter(n => n.index < resultMatch.index);
                    let measured = null;
                    if (after.length > 0) measured = after[0];
                    else if (before.length > 0) measured = before[before.length - 1];
                    if (measured) {
                        let rowLimit = null;
                        if (limitMatchB) {
                            const limitCandidates = numbers.filter(n => n !== measured && n.index > limitMatchB.index);
                            const limitBefore = numbers.filter(n => n !== measured && n.index < limitMatchB.index);
                            const limitPick = limitCandidates.length > 0 ? limitCandidates[0]
                                : (limitBefore.length > 0 ? limitBefore[limitBefore.length - 1] : null);
                            if (limitPick) rowLimit = limitPick.value;
                        }
                        return { value: measured.value, snippet: line, nextLineIndex: null, rowLimit };
                    }
                }

                // Strategy C: narrative single-number sentence, e.g. "...recorded at 245
                // mg/Nm3". Only accepted with a unit or a standard/limit keyword nearby —
                // otherwise a lone number is too weak a signal (could be a year, a chapter
                // or section reference, a page number, etc.) and is rejected. There's only
                // one number here, so no counterpart row limit is available.
                if (numbers.length === 1) {
                    if (isBareYearLikeValue(numbers[0].value, line)) return null;
                    if (hasUnit || hasLimitKw) {
                        return { value: numbers[0].value, snippet: line, nextLineIndex: null };
                    }
                    return null;
                }

                // Strategy D: bare tabular row, e.g. "Parameter Unit Standard Actual" or
                // "Parameter Unit Result Norms" — which column is the real reading isn't
                // universal, so this defers to whatever order was detected from the
                // document's own header row (resultColumnIsFirst). If no header was ever
                // matched on this page, fall back to the original right-most assumption.
                // Many lab reports (GPCB/CPCB test certificates especially) print the
                // exact statutory/consent limit right in the same row as the result —
                // when there are exactly two numeric columns and the column order is
                // known, the counterpart number IS that printed limit, so it's captured
                // as rowLimit here for the caller to prefer over a generic default. With
                // three or more leftover numbers, or an undetected column order, guessing
                // which one is the limit is too unreliable, so rowLimit is left null.
                const chosenIdx = (resultColumnIsFirst === true) ? 0 : numbers.length - 1;
                const otherIdx = (resultColumnIsFirst === true) ? numbers.length - 1 : 0;
                const rowLimitD = (numbers.length === 2 && resultColumnIsFirst !== null) ? numbers[otherIdx].value : null;
                return { value: numbers[chosenIdx].value, snippet: line, nextLineIndex: null, rowLimit: rowLimitD };
            }

            // Strategy E: label-only line (common when a table wraps the reading onto the
            // next row/line) — look ahead a couple of lines for the first usable number,
            // requiring the same unit/keyword/multi-column evidence before accepting it.
            if (nextLines && nextLines.length) {
                for (let k = 0; k < nextLines.length; k++) {
                    const nextLine = nextLines[k];
                    if (isLikelyHeadingOrTocLine(nextLine)) continue;
                    const nums = extractNumberTokens(nextLine);
                    if (nums.length === 0) continue;

                    const nextHasUnit = ANY_UNIT_RE.test(nextLine);
                    const nextHasKw = RESULT_KEYWORD_RE.test(nextLine) || LIMIT_KEYWORD_RE.test(nextLine);

                    if (nums.length >= 2 || nextHasUnit || nextHasKw) {
                        if (nums.length === 1 && isBareYearLikeValue(nums[0].value, nextLine)) continue;
                        const chosenIdx2 = (resultColumnIsFirst === true) ? 0 : nums.length - 1;
                        const otherIdx2 = (resultColumnIsFirst === true) ? nums.length - 1 : 0;
                        const rowLimitE = (nums.length === 2 && resultColumnIsFirst !== null) ? nums[otherIdx2].value : null;
                        const chosen = nums[chosenIdx2];
                        return { value: chosen.value, snippet: `${line} \u2026 ${nextLine}`, nextLineIndex: k, rowLimit: rowLimitE };
                    }
                    // A bare single number with no supporting evidence — keep looking at
                    // subsequent lines rather than guessing.
                }
            }
            return null;
        }

        const rectificationAdvice = {
            pm: "Upgrade/inspect ESP or bag-filter efficiency; verify stack draft and dust collection system.",
            pm25: "Investigate fine-particulate sources (combustion, vehicular movement, fugitive dust); review ESP/bag-filter fine-fraction efficiency and secondary aerosol precursors (SO2/NOx).",
            so2: "Install or service FGD (Flue Gas Desulphurization) unit; check fuel sulphur content.",
            nox: "Tune combustion (low-NOx burners / SCR); verify furnace temperature and air-fuel ratio.",
            co: "Improve combustion efficiency and excess-air control; inspect burner maintenance schedule."
        };

        // ---- State / Regulatory Authority reference notes ----
        // State Boards adopt CPCB Schedule VI as the statutory floor for CTE/CTO, but the
        // legally binding figures for any specific plant are always the ones in that plant's
        // own consent order (CTO/EC). We deliberately do NOT hardcode invented state-specific
        // numeric limits here (doing so could be wrong and mislead a real audit) — instead we
        // surface the correct context per authority and route the user to the Manual Limit
        // Override fields so the *actual* consent-order figures drive the audit.
        const authorityInfo = {
            "cpcb": {
                label: "CPCB (Central)",
                note: "CPCB Schedule VI is the statutory national floor. Applied directly below."
            },
            "gpcb": {
                label: "GPCB (Gujarat)",
                note: "GPCB enforces CPCB Schedule VI as the minimum via CTE/CTO. Units inside Gujarat's CPCB-notified Critically Polluted Areas (Vapi, Ankleshwar, Vatva-Narol, Ahmedabad/Naroda-Odhav, Bhavnagar, Junagadh &mdash; CEPI &gt; 70) commonly face stricter, site-specific conditions. Enter the exact CTO figures in Manual Limit Override for an accurate audit."
            },
            "mpcb": {
                label: "MPCB (Maharashtra)",
                note: "MPCB applies CPCB Schedule VI as the baseline and may impose stricter site-specific limits in notified Critically/Severely Polluted Areas (e.g. Chandrapur, Tarapur). Use Manual Limit Override with the plant's CTO figures where applicable."
            },
            "tnpcb": {
                label: "TNPCB (Tamil Nadu)",
                note: "TNPCB applies CPCB Schedule VI as the baseline; specific CTO conditions for the unit govern the legally binding limit. Use Manual Limit Override where the consent order differs."
            },
            "uppcb": {
                label: "UPPCB (Uttar Pradesh)",
                note: "UPPCB applies CPCB Schedule VI as the baseline; specific CTO conditions govern the legally binding limit, particularly in NCR/industrial belt units. Use Manual Limit Override where the consent order differs."
            },
            "rpcb": {
                label: "RPCB (Rajasthan)",
                note: "RPCB applies CPCB Schedule VI as the baseline; specific CTO conditions govern the legally binding limit. Use Manual Limit Override where the consent order differs."
            },
            "kspcb": {
                label: "KSPCB (Karnataka)",
                note: "KSPCB applies CPCB Schedule VI as the baseline; specific CTO conditions govern the legally binding limit. Use Manual Limit Override where the consent order differs."
            },
            "wbpcb": {
                label: "WBPCB (West Bengal)",
                note: "WBPCB applies CPCB Schedule VI as the baseline; specific CTO conditions govern the legally binding limit. Use Manual Limit Override where the consent order differs."
            },
            "appcb-tspcb": {
                label: "APPCB/TSPCB (AP/Telangana)",
                note: "APPCB/TSPCB apply CPCB Schedule VI as the baseline; specific CTO conditions govern the legally binding limit. Use Manual Limit Override where the consent order differs."
            },
            "other-spcb": {
                label: "Other SPCB/UTPCC",
                note: "Most SPCBs/UTPCCs adopt CPCB Schedule VI as the statutory floor and issue stricter site-specific figures via the CTO. Always enter the actual consent-order values in Manual Limit Override for a state/site-accurate audit."
            }
        };

        // Merge manual overrides on top of the selected industry's Schedule VI limits.
        // Any override field left blank falls back to the default schedule value.
        function getEffectiveLimits(industryKey) {
            const base = emissionStandards[industryKey].limits;
            const overrides = {
                pm: overridePmInput && overridePmInput.value !== "" ? parseFloat(overridePmInput.value) : null,
                pm25: overridePm25Input && overridePm25Input.value !== "" ? parseFloat(overridePm25Input.value) : null,
                so2: overrideSo2Input && overrideSo2Input.value !== "" ? parseFloat(overrideSo2Input.value) : null,
                nox: overrideNoxInput && overrideNoxInput.value !== "" ? parseFloat(overrideNoxInput.value) : null,
                co: overrideCoInput && overrideCoInput.value !== "" ? parseFloat(overrideCoInput.value) : null
            };
            const effective = {}, sources = {};
            Object.keys(base).forEach(key => {
                if (overrides[key] != null && !isNaN(overrides[key])) {
                    effective[key] = overrides[key];
                    sources[key] = "override";
                } else {
                    effective[key] = base[key];
                    sources[key] = "cpcb";
                }
            });
            return { limits: effective, sources };
        }

        function formatEffectiveLimitsSummary(limits, sources) {
            const paramLabels = { pm: "PM/PM10", pm25: "PM2.5", so2: "SO\u2082", nox: "NOx/NO\u2082", co: "CO" };
            return Object.keys(paramLabels).map(key => {
                if (limits[key] == null) return `${paramLabels[key]}: N/A`;
                const tag = sources[key] === "override" ? " (override)" : "";
                return `${paramLabels[key]}: ${limits[key]}${tag}`;
            }).join(" \u00b7 ");
        }

        const companyPatterns = [
            /M\/s\.?\s*([A-Z][A-Za-z0-9&.,'\-\s]{3,90}?(?:Ltd|Limited|Pvt\.?\s*Ltd\.?|LLP|Industries|Corporation|Company|Enterprises|Mills|Cements?|Power|Steel|Refinery|Plant|Sugar|Chemicals?))/,
            /Name of (?:the )?Project Proponent\s*[:\-]\s*([A-Za-z0-9&.,'\-\s]{3,90})/i,
            /Project Proponent\s*[:\-]\s*([A-Za-z0-9&.,'\-\s]{3,90})/i,
            /Name of (?:the )?(?:Unit|Industry|Company)\s*[:\-]\s*([A-Za-z0-9&.,'\-\s]{3,90})/i
        ];

        function escapeHtml(str) {
            return String(str)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;");
        }

        function extractCompanyName(text) {
            for (const pattern of companyPatterns) {
                const match = text.match(pattern);
                if (match && match[1]) {
                    return match[1].trim().replace(/\s+/g, " ").replace(/[,\.]+$/, "").slice(0, 90);
                }
            }
            return null;
        }

        // ---- Proponent/Company Name Verification (mismatch & missing detection) ----
        // Deliberately narrow: only strip boilerplate that's almost always
        // interchangeable across citations of the same entity. Words like
        // "Corporation", "Industries", or "Group" are often part of the
        // actual identity (e.g. "XYZ Industries") and stripping them would
        // wreck token-similarity matching on short company names.
        const CN_LEGAL_SUFFIXES = [
            "pvt ltd", "pvt. ltd.", "private limited", "ltd", "limited",
            "llp", "m/s", "ms."
        ];
        const CN_MISMATCH_THRESHOLD = 0.8; // similarity >= this => treat as the same name
        const CN_IGNORE_THRESHOLD = 0.5;   // similarity below this => name not present on the page

        // A report often shorthands the full legal name ("Umiya Corp" for "Umiya
        // Corporation Pvt Ltd") — without normalizing these, a genuine same-entity
        // mention could score just under the "present on page" threshold and get
        // silently treated as if the company name didn't appear at all. Mapping common
        // abbreviations to one canonical form (applied to both sides before comparing)
        // catches this without needing every variant added as a manual alias.
        const CN_ABBREVIATION_MAP = {
            "corp": "corporation", "co": "company", "inds": "industries",
            "ind": "industries", "intl": "international", "mfg": "manufacturing",
            "eng": "engineering", "engg": "engineering", "tech": "technologies",
            "&": "and"
        };

        function cnNormalize(str) {
            if (!str) return "";
            return str.toLowerCase().replace(/[.,()]/g, " ").replace(/\s+/g, " ").trim();
        }

        function cnCanonicalizeAbbreviations(str) {
            return str.split(" ").map(tok => CN_ABBREVIATION_MAP[tok] || tok).join(" ");
        }

        function cnStripSuffixes(str) {
            let s = cnNormalize(str);
            CN_LEGAL_SUFFIXES.forEach(suffix => {
                const re = new RegExp(`\\b${suffix.replace(/\./g, "\\.")}\\b`, "g");
                s = s.replace(re, " ");
            });
            s = cnCanonicalizeAbbreviations(s.replace(/\s+/g, " ").trim());
            return s.replace(/\s+/g, " ").trim();
        }

        // Character-level edit distance — catches typos/misspellings
        function cnLevenshtein(a, b) {
            const m = a.length, n = b.length;
            if (m === 0) return n;
            if (n === 0) return m;
            const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
            for (let i = 0; i <= m; i++) dp[i][0] = i;
            for (let j = 0; j <= n; j++) dp[0][j] = j;
            for (let i = 1; i <= m; i++) {
                for (let j = 1; j <= n; j++) {
                    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
                }
            }
            return dp[m][n];
        }

        function cnCharSimilarity(a, b) {
            const dist = cnLevenshtein(a, b);
            const maxLen = Math.max(a.length, b.length) || 1;
            return 1 - dist / maxLen;
        }

        // Token-level Jaccard similarity — catches reordering / dropped words
        function cnTokenSimilarity(a, b) {
            const ta = new Set(a.split(" ").filter(Boolean));
            const tb = new Set(b.split(" ").filter(Boolean));
            if (ta.size === 0 && tb.size === 0) return 1;
            const intersection = [...ta].filter(t => tb.has(t)).length;
            const union = new Set([...ta, ...tb]).size;
            return union === 0 ? 0 : intersection / union;
        }

        function cnSimilarity(a, b) {
            const na = cnStripSuffixes(a);
            const nb = cnStripSuffixes(b);
            if (!na || !nb) return 0;
            return (cnCharSimilarity(na, nb) + cnTokenSimilarity(na, nb)) / 2;
        }

        // Sliding-window candidate phrases matching the expected name's word count (+/- 1)
        function cnExtractCandidates(text, expectedWordCount) {
            const words = cnNormalize(text).split(" ").filter(Boolean);
            const candidates = new Set();
            [expectedWordCount - 1, expectedWordCount, expectedWordCount + 1].forEach(span => {
                if (span < 1) return;
                for (let i = 0; i <= words.length - span; i++) {
                    candidates.add(words.slice(i, i + span).join(" "));
                }
            });
            return [...candidates];
        }

        // Parses "1-3, 40-50" style range strings; empty/blank => no filter (check every page)
        function cnParseRanges(str) {
            if (!str || !str.trim()) return [];
            return str.split(",").map(part => {
                const nums = part.trim().split("-").map(n => parseInt(n, 10));
                const from = nums[0];
                const to = (nums.length > 1 && !isNaN(nums[1])) ? nums[1] : from;
                return { from, to };
            }).filter(r => !isNaN(r.from));
        }

        function cnPageInRanges(pageNumber, ranges) {
            if (!ranges || ranges.length === 0) return true;
            return ranges.some(r => pageNumber >= r.from && pageNumber <= r.to);
        }

        // Checks a single page's text against the expected name + aliases.
        // Returns null if this page falls outside the selected verification range.
        function checkPageForCompanyName(pageText, pdfPage, printedPage, expectedName, aliases, ranges) {
            if (!cnPageInRanges(pdfPage, ranges)) return null;

            const allNames = [expectedName, ...aliases];
            const expectedWordCount = cnNormalize(expectedName).split(" ").filter(Boolean).length || 1;
            const candidates = cnExtractCandidates(pageText, expectedWordCount);

            let bestScore = 0, bestCandidate = null, bestAgainst = expectedName;
            candidates.forEach(candidate => {
                allNames.forEach(name => {
                    const score = cnSimilarity(candidate, name);
                    if (score > bestScore) {
                        bestScore = score;
                        bestCandidate = candidate;
                        bestAgainst = name;
                    }
                });
            });

            let status, found;
            if (bestScore >= CN_MISMATCH_THRESHOLD) {
                status = "match"; found = bestCandidate;
            } else if (bestScore >= CN_IGNORE_THRESHOLD) {
                status = "mismatch"; found = bestCandidate;
            } else {
                status = "missing"; found = null;
            }

            return {
                pdfPage, printedPage,
                expected: bestAgainst,
                found,
                similarity: Math.round(bestScore * 100) / 100,
                status
            };
        }

        function renderCompanyCheckSection(doc) {
            if (!companyCheckSection) return;
            const checks = doc.companyNameChecks || [];

            if (checks.length === 0) {
                companyCheckSection.style.display = "none";
                return;
            }

            companyCheckSection.style.display = "block";
            const matchCount = checks.filter(c => c.status === "match").length;
            const mismatchCount = checks.filter(c => c.status === "mismatch").length;
            const missingCount = checks.filter(c => c.status === "missing").length;

            companyCheckSummaryEl.textContent =
                `${checks.length} page(s) checked \u00b7 ${matchCount} match \u00b7 ${mismatchCount} mismatch \u00b7 ${missingCount} missing`;

            const flagged = checks.filter(c => c.status !== "match");
            if (flagged.length === 0) {
                companyCheckTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-dim); padding: 14px;">Proponent name verified consistently across all checked pages.</td></tr>`;
            } else {
                companyCheckTbody.innerHTML = flagged.map(c => `
                    <tr>
                        <td>Page ${c.printedPage}${c.printedPage !== c.pdfPage ? ` <span style="color:var(--text-dim); font-weight:400;">(PDF pg ${c.pdfPage})</span>` : ""}</td>
                        <td>${escapeHtml(c.expected)}</td>
                        <td>${c.found ? escapeHtml(c.found) : `<span style="color:var(--text-dim);">Not found on page</span>`}</td>
                        <td><span class="cn-status-pill cn-${c.status}">${c.status === "mismatch" ? "Mismatch" : "Missing"}</span></td>
                    </tr>
                `).join("");
            }
        }

        // Group raw PDF.js text items into reading-order lines (left-to-right, top-to-bottom)
        // Group raw PDF.js text items into reading-order lines WITH bounding boxes
        // (PDF user-space coordinates), so exceedance highlights can be drawn on the
        // rendered page later. Returns [{ text, x0, y0, x1, y1 }, ...].
        // Groups text items into visual rows/lines. A fixed rounding grid (the previous
        // approach) is too strict for real-world table exports: different columns in the
        // "same" row are frequently a few points off in baseline y (independent per-cell
        // text boxes, mixed font sizes, PDF generator quirks), which was splitting one
        // table row into several one-or-two-word fragments. That, in turn, meant a data
        // row's Result/Limit numbers often ended up on a *different* fragment than the
        // parameter name, and a header row's "RESULT" and "NORMS" labels could land in
        // separate fragments too — silently defeating the column-order detection and the
        // multi-column reading logic. A tolerance window (rather than a rigid grid) keeps
        // items that are visually on the same line together regardless of which side of a
        // rounding boundary they'd otherwise fall on.
        const ROW_Y_TOLERANCE = 3; // points; generous enough for typical cell jitter, tight
                                    // enough not to merge genuinely different table rows
        function clusterItemsIntoRows(items) {
            const sorted = items.slice().sort((a, b) => b.transform[5] - a.transform[5]);
            const rows = [];
            sorted.forEach(item => {
                const y = item.transform[5];
                let row = rows.find(r => Math.abs(r.anchorY - y) <= ROW_Y_TOLERANCE);
                if (!row) {
                    row = { anchorY: y, items: [] };
                    rows.push(row);
                }
                row.items.push(item);
            });
            return rows;
        }

        function groupItemsIntoLineObjects(items) {
            return clusterItemsIntoRows(items).map(row => {
                const lineItems = row.items.slice().sort((a, b) => a.transform[4] - b.transform[4]);
                const text = lineItems.map(it => it.str).join(" ").replace(/\s+/g, " ").trim();
                let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
                lineItems.forEach(it => {
                    const ix0 = it.transform[4];
                    const ix1 = ix0 + (it.width || 0);
                    const iy0 = it.transform[5];
                    const iy1 = iy0 + (it.height || 9);
                    if (ix0 < x0) x0 = ix0;
                    if (ix1 > x1) x1 = ix1;
                    if (iy0 < y0) y0 = iy0;
                    if (iy1 > y1) y1 = iy1;
                });
                return { text, x0, y0, x1, y1 };
            }).filter(l => l.text.length > 0);
        }

        function groupItemsIntoLines(items) {
            return clusterItemsIntoRows(items).map(row => {
                const lineItems = row.items.slice().sort((a, b) => a.transform[4] - b.transform[4]);
                return lineItems.map(it => it.str).join(" ").replace(/\s+/g, " ").trim();
            }).filter(line => line.length > 0);
        }

        // Try to find the printed footer/header page number; fall back to PDF page index
        function detectPrintedPageNumber(lines, fallback) {
            const scanRange = lines.slice(-4).concat(lines.slice(0, 2));
            for (const raw of scanRange) {
                const l = raw.trim();
                let m = l.match(/^page\s*(\d{1,4})\s*(?:of\s*\d{1,4})?$/i);
                if (m) return parseInt(m[1], 10);
                m = l.match(/^(\d{1,4})\s*\/\s*\d{1,4}$/);
                if (m) return parseInt(m[1], 10);
                m = l.match(/^-?\s*(\d{1,4})\s*-?$/);
                if (m && l.length <= 6) return parseInt(m[1], 10);
            }
            return fallback;
        }

        function updateQueueMeta(docId, text) {
            const el = document.getElementById(`queue-meta-${docId}`);
            if (el) el.textContent = text;
        }

        function updateQueueStatus(docId, text, cls) {
            const statusEl = document.getElementById(`queue-status-${docId}`);
            const barEl = document.getElementById(`queue-progress-${docId}`);
            if (statusEl) {
                statusEl.textContent = text;
                statusEl.style.color = cls === "error" ? "var(--color-danger)" : cls === "success" ? "var(--color-success)" : cls === "warning" ? "var(--color-warning)" : "var(--text-secondary)";
            }
            if (barEl && cls) {
                barEl.className = "progress-bar-fill " + cls;
            }
        }

        function updateQueueProgress(docId, pct) {
            const barEl = document.getElementById(`queue-progress-${docId}`);
            if (barEl) barEl.style.width = `${Math.min(100, Math.round(pct))}%`;
        }

        function createQueueItem(docId, filename) {
            const emptyText = queueContainer.querySelector(".empty-queue-text");
            if (emptyText) emptyText.remove();

            const div = document.createElement("div");
            div.className = "queue-item";
            div.id = `queue-item-${docId}`;
            div.style.cursor = "pointer";
            div.innerHTML = `
                <div class="queue-file-info">
                    <div class="queue-filename" title="${escapeHtml(filename)}"><i class="fa-solid fa-file-pdf" style="color:var(--color-danger); margin-right:6px;"></i>${escapeHtml(filename)}</div>
                    <div class="queue-meta" id="queue-meta-${docId}">Waiting to start\u2026</div>
                </div>
                <div class="queue-progress-wrapper">
                    <span class="queue-status-text" id="queue-status-${docId}">Queued</span>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" id="queue-progress-${docId}" style="width:0%"></div>
                    </div>
                </div>
            `;
            div.addEventListener("click", () => showReportForDoc(docId));
            queueContainer.appendChild(div);
            return div;
        }

        function highlightActiveQueueItem(docId) {
            queueContainer.querySelectorAll(".queue-item").forEach(el => {
                el.style.borderColor = "rgba(255,255,255,0.04)";
                el.style.background = "rgba(255,255,255,0.02)";
            });
            const activeEl = document.getElementById(`queue-item-${docId}`);
            if (activeEl) {
                activeEl.style.borderColor = "var(--color-primary)";
                activeEl.style.background = "rgba(191, 138, 61, 0.06)";
            }
        }

        // ---- On-demand PDF page preview (renders the actual page + draws red highlight
        // boxes over any flagged exceedance text found on that page) ----
        async function renderPreviewPage(pageNum) {
            if (!previewPdfDoc || !previewCanvas) return;
            const clamped = Math.min(Math.max(1, pageNum), previewPdfDoc.numPages);
            previewCurrentPage = clamped;
            const page = await previewPdfDoc.getPage(clamped);
            const viewport = page.getViewport({ scale: 1.3 });
            const ctx = previewCanvas.getContext("2d");
            previewCanvas.width = viewport.width;
            previewCanvas.height = viewport.height;
            await page.render({ canvasContext: ctx, viewport }).promise;

            // Draw red highlight boxes over any exceedances found on this page
            const doc = previewActiveDoc;
            const pageViolations = (doc && doc.violations) ? doc.violations.filter(v => v.pdfPage === clamped) : [];
            if (pageViolations.length) {
                ctx.save();
                ctx.strokeStyle = "rgba(220, 38, 38, 0.95)";
                ctx.fillStyle = "rgba(220, 38, 38, 0.22)";
                ctx.lineWidth = 2;
                pageViolations.forEach(v => {
                    (v.highlightBoxes || []).forEach(box => {
                        const rect = viewport.convertToViewportRectangle([box.x0, box.y0, box.x1, box.y1]);
                        const rx = Math.min(rect[0], rect[2]) - 3;
                        const ry = Math.min(rect[1], rect[3]) - 3;
                        const rw = Math.abs(rect[2] - rect[0]) + 6;
                        const rh = Math.abs(rect[3] - rect[1]) + 6;
                        ctx.fillRect(rx, ry, rw, rh);
                        ctx.strokeRect(rx, ry, rw, rh);
                    });
                });
                ctx.restore();
            }

            if (previewPageLabel) previewPageLabel.textContent = `Page ${clamped} of ${previewPdfDoc.numPages}`;
            if (previewJumpInput) previewJumpInput.value = clamped;

            if (previewPageIssuesEl) {
                if (pageViolations.length) {
                    previewPageIssuesEl.style.display = "block";
                    previewPageIssuesEl.innerHTML = "<i class=\"fa-solid fa-triangle-exclamation\"></i> " +
                        pageViolations.map(v => `${escapeHtml(v.label)}: ${v.measured} ${escapeHtml(v.unit || "mg/Nm\u00b3")} (limit ${v.limit})`).join(" &nbsp;|&nbsp; ");
                } else {
                    previewPageIssuesEl.style.display = "none";
                    previewPageIssuesEl.innerHTML = "";
                }
            }
        }

        function renderFlaggedPagesNav(doc) {
            if (!previewFlaggedPagesEl) return;
            const pages = [...new Set((doc.violations || []).map(v => v.pdfPage))].sort((a, b) => a - b);
            if (pages.length === 0) {
                previewFlaggedPagesEl.innerHTML = `<span style="font-size:11px; color:var(--text-dim);">No exceedances flagged in this document.</span>`;
                return;
            }
            previewFlaggedPagesEl.innerHTML = `<span style="font-size:11px; color:var(--text-dim); margin-right:4px;">Flagged pages:</span>` +
                pages.map(p => `<button type="button" class="btn btn-outline btn-sm flagged-page-btn" data-page="${p}" style="padding:2px 8px; font-size:10.5px; border-color: rgba(220,38,38,0.5); color: var(--color-danger);">${p}</button>`).join("");
            previewFlaggedPagesEl.querySelectorAll(".flagged-page-btn").forEach(btn => {
                btn.addEventListener("click", () => renderPreviewPage(parseInt(btn.dataset.page, 10)));
            });
        }

        async function openPdfPreview(doc, pageNum) {
            if (!doc || !doc.previewBuffer || !previewSection) return;
            try {
                previewActiveDoc = doc;
                previewSection.classList.remove("hidden");
                if (previewPageLabel) previewPageLabel.textContent = "Loading\u2026";
                previewPdfDoc = await pdfjsLib.getDocument({ data: doc.previewBuffer.slice(0) }).promise;
                if (previewJumpInput) previewJumpInput.max = previewPdfDoc.numPages;
                renderFlaggedPagesNav(doc);
                await renderPreviewPage(pageNum || 1);
                previewSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
            } catch (err) {
                console.error("Could not render PDF preview page", err);
                if (previewPageLabel) previewPageLabel.textContent = "Preview unavailable";
            }
        }

        function closePdfPreview() {
            if (previewSection) previewSection.classList.add("hidden");
            previewPdfDoc = null;
            previewActiveDoc = null;
        }

        if (previewPrevBtn) previewPrevBtn.addEventListener("click", () => renderPreviewPage(previewCurrentPage - 1));
        if (previewNextBtn) previewNextBtn.addEventListener("click", () => renderPreviewPage(previewCurrentPage + 1));
        if (previewCloseBtn) previewCloseBtn.addEventListener("click", closePdfPreview);
        if (previewJumpBtn) {
            previewJumpBtn.addEventListener("click", () => {
                const val = previewJumpInput ? parseInt(previewJumpInput.value, 10) : NaN;
                if (!isNaN(val)) renderPreviewPage(val);
            });
        }
        if (previewJumpInput) {
            previewJumpInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    const val = parseInt(previewJumpInput.value, 10);
                    if (!isNaN(val)) renderPreviewPage(val);
                }
            });
        }
        if (viewAllPagesBtn) {
            viewAllPagesBtn.addEventListener("click", () => {
                const doc = auditedDocs[activeDocId];
                if (!doc) return;
                if (!doc.previewBuffer) {
                    alert("Full-page preview is only available for real uploaded PDFs (not the mock demo audits).");
                    return;
                }
                openPdfPreview(doc, 1);
            });
        }

        function showReportForDoc(docId) {
            const doc = auditedDocs[docId];
            if (!doc || doc.status === "processing" || doc.status === "queued") return;

            activeDocId = docId;
            highlightActiveQueueItem(docId);

            if (placeholder) placeholder.classList.add("hidden");
            if (reportDetails) reportDetails.classList.remove("hidden");

            companyNameEl.textContent = doc.companyName || "Not Detected (Manual Review Required)";
            filenameEl.textContent = doc.name;
            industryEl.textContent = doc.industryName;
            pageCountEl.textContent = `${doc.totalPages} pages`;
            if (authorityEl) authorityEl.textContent = doc.authorityLabel || "CPCB (Central)";
            if (effectiveLimitsEl && doc.effectiveLimits) {
                effectiveLimitsEl.textContent = formatEffectiveLimitsSummary(doc.effectiveLimits, doc.limitSources || {});
            }
            const lastScannedEl = document.getElementById("report-last-scanned");
            if (lastScannedEl) {
                lastScannedEl.textContent = doc.lastScannedAt
                    ? doc.lastScannedAt.toLocaleTimeString()
                    : "Not yet scanned";
            }
            closePdfPreview();

            if (doc.status === "error") {
                bannerEl.className = "status-banner danger";
                if (bannerIconEl) bannerIconEl.className = "fa-solid fa-triangle-exclamation";
                bannerTitleEl.textContent = "Could Not Process Document";
                bannerDescEl.textContent = doc.error || "This file could not be read. It may be scanned/image-only or corrupted.";
                if (violationsSection) violationsSection.style.display = "none";
                if (companyCheckSection) companyCheckSection.style.display = "none";
                return;
            }

            renderCompanyCheckSection(doc);

            if (violationsSection) violationsSection.style.display = "flex";

            if (doc.violations.length === 0) {
                bannerEl.className = "status-banner success";
                if (bannerIconEl) bannerIconEl.className = "fa-solid fa-circle-check";
                bannerTitleEl.textContent = "Document Fully Compliant";
                bannerDescEl.textContent = `No stack emission limits exceeded across ${doc.totalPages} pages, audited against ${doc.industryName} standards.`;
            } else {
                bannerEl.className = "status-banner danger";
                if (bannerIconEl) bannerIconEl.className = "fa-solid fa-triangle-exclamation";
                bannerTitleEl.textContent = `${doc.violations.length} Exceedance${doc.violations.length > 1 ? "s" : ""} Found`;
                bannerDescEl.textContent = `Flagged against ${doc.industryName} limits. Review the line-by-line breakdown below.`;
            }

            violationsTbody.innerHTML = "";
            if (doc.violations.length === 0) {
                violationsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-dim); padding: 20px;">No exceedances detected.</td></tr>`;
            } else {
                doc.violations.forEach(v => {
                    const row = document.createElement("tr");
                    const canPreview = !!doc.previewBuffer;
                    row.innerHTML = `
                        <td class="param-name">${escapeHtml(v.label)}</td>
                        <td class="value-high">${v.measured} ${escapeHtml(v.unit || "mg/Nm\u00b3")} <span style="font-size:10px; color:var(--text-dim); font-weight:400;">(from RESULT col)</span></td>
                        <td>${v.limit} ${escapeHtml(v.unit || "mg/Nm\u00b3")} <span style="font-size:10px; color:var(--text-dim);">${v.limitSource === "document" ? "(as printed in report)" : "(industry default)"}</span></td>
                        <td class="location-badge">
                            <span>Page ${v.printedPage}${v.printedPage !== v.pdfPage ? ` <span style="color:var(--text-dim); font-weight:400;">(PDF pg ${v.pdfPage})</span>` : ""}</span>
                            ${canPreview ? `<button type="button" class="btn btn-outline btn-sm view-page-btn" data-page="${v.pdfPage}" style="display:block; margin-top:4px; padding:2px 8px; font-size:10px;"><i class="fa-solid fa-eye"></i> View Page</button>` : ""}
                        </td>
                        <td>
                            <span class="line-snippet">${escapeHtml(v.line)}</span>
                            <span class="rectification-advice"><strong>Action:</strong> ${escapeHtml(v.advice)}</span>
                        </td>
                    `;
                    violationsTbody.appendChild(row);
                });
                violationsTbody.querySelectorAll(".view-page-btn").forEach(btn => {
                    btn.addEventListener("click", () => openPdfPreview(doc, parseInt(btn.dataset.page, 10)));
                });
            }
        }

        // ---- OCR fallback for scanned / image-only PDF pages ----
        // pdf.js's getTextContent() only returns text baked into the PDF as an actual
        // text layer — a photographed/scanned page (or a table flattened into an image)
        // has none, and would otherwise be silently skipped entirely, with no error and
        // no exceedance check at all. When a page's text layer is essentially empty, this
        // renders it to a canvas and runs it through Tesseract.js, then converts the OCR
        // word boxes back into the same {text, x0, y0, x1, y1} line-object shape the rest
        // of the engine already works with — every existing detection strategy, and the
        // red highlight overlay, work on OCR'd pages exactly like normal text-layer pages.
        const OCR_RENDER_SCALE = 2.0; // higher = sharper OCR input, at some added time cost
        const OCR_SPARSE_TEXT_THRESHOLD = 25; // chars; below this, treat page as scanned

        async function ocrPageToLineObjs(page) {
            if (typeof Tesseract === "undefined") return []; // OCR script failed to load (e.g. offline)

            const viewport = page.getViewport({ scale: OCR_RENDER_SCALE });
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext("2d");
            await page.render({ canvasContext: ctx, viewport }).promise;

            let data;
            try {
                const result = await Tesseract.recognize(canvas, "eng");
                data = result.data;
            } catch (err) {
                console.error("OCR failed for a page", err);
                return [];
            }
            const words = (data && data.words) || [];

            // Group OCR words into lines by vertical position — same bucketing idea as
            // groupItemsIntoLineObjects, just working from Tesseract's pixel bboxes.
            const buckets = new Map();
            words.forEach(w => {
                if (!w.text || !w.text.trim() || !w.bbox) return;
                const midY = (w.bbox.y0 + w.bbox.y1) / 2;
                const bucketKey = Math.round(midY / 12) * 12; // ~12px tolerance band per line
                if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
                buckets.get(bucketKey).push(w);
            });

            const lineObjs = [];
            Array.from(buckets.keys()).sort((a, b) => a - b).forEach(key => {
                const wordsInLine = buckets.get(key).sort((a, b) => a.bbox.x0 - b.bbox.x0);
                const text = wordsInLine.map(w => w.text).join(" ").replace(/\s+/g, " ").trim();
                if (!text) return;

                let px0 = Infinity, py0 = Infinity, px1 = -Infinity, py1 = -Infinity;
                wordsInLine.forEach(w => {
                    px0 = Math.min(px0, w.bbox.x0);
                    py0 = Math.min(py0, w.bbox.y0);
                    px1 = Math.max(px1, w.bbox.x1);
                    py1 = Math.max(py1, w.bbox.y1);
                });

                // Canvas pixel space -> PDF user space (inverse of the render viewport),
                // so OCR'd bboxes line up with text-layer bboxes for the highlight overlay.
                const corner1 = viewport.convertToPdfPoint(px0, py0);
                const corner2 = viewport.convertToPdfPoint(px1, py1);
                const xs = [corner1[0], corner2[0]];
                const ys = [corner1[1], corner2[1]];

                lineObjs.push({
                    text,
                    x0: Math.min(...xs), x1: Math.max(...xs),
                    y0: Math.min(...ys), y1: Math.max(...ys)
                });
            });

            return lineObjs;
        }

        // Core: extract text page-by-page and flag exceedances
        async function auditPdfFile(file, industryKey, docId, companyOptions, effectiveLimits, customParamDefs) {
            const limits = effectiveLimits || emissionStandards[industryKey].limits;
            const customDefs = (customParamDefs || []).map(p => ({ ...p, regex: buildCustomKeywordRegex(p.name) })).filter(p => p.regex);
            // Reset per document — a header row's Result/Norms column order detected in
            // one PDF must never leak into the next file that gets audited.
            resultColumnIsFirst = null;
            const arrayBuffer = await file.arrayBuffer();
            // Keep a pristine copy for later on-demand page preview — pdf.js can take
            // ownership of/transfer the buffer it's handed, so the audit pass gets a clone.
            const previewBuffer = arrayBuffer.slice(0);
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const totalPages = pdf.numPages;
            const violations = [];
            const companyNameChecks = [];
            let companyName = null;

            const hasExpectedName = !!(companyOptions && companyOptions.expectedName);
            let ocrPagesUsed = 0;

            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                let lineObjs = groupItemsIntoLineObjects(content.items);
                let lineTexts = lineObjs.map(l => l.text);

                // A page with no (or almost no) extractable text is very likely a scanned
                // image rather than a text-layer page — fall back to OCR so it still gets
                // checked instead of silently passing through unscanned.
                const extractedCharCount = lineTexts.join("").length;
                if (content.items.length === 0 || extractedCharCount < OCR_SPARSE_TEXT_THRESHOLD) {
                    updateQueueMeta(docId, `Page ${i} has no text layer \u2014 running OCR (this can take longer)\u2026`);
                    const ocrLineObjs = await ocrPageToLineObjs(page);
                    if (ocrLineObjs.length > 0) {
                        lineObjs = ocrLineObjs;
                        lineTexts = lineObjs.map(l => l.text);
                        ocrPagesUsed += 1;
                    }
                }

                const printedPage = detectPrintedPageNumber(lineTexts, i);
                const pageText = lineTexts.join(" \n ");

                if (!companyName && i <= 15) {
                    companyName = extractCompanyName(pageText);
                }

                if (hasExpectedName) {
                    const check = checkPageForCompanyName(
                        pageText, i, printedPage,
                        companyOptions.expectedName, companyOptions.aliases, companyOptions.ranges
                    );
                    if (check) companyNameChecks.push(check);
                }

                // ---- Enhanced emission exceedance scan ----
                // Real stack-monitoring tables rarely repeat "mg/Nm3" next to every number —
                // the unit is usually stated once in a column header. So rather than requiring
                // a number+unit glued together on one line (which misses almost every tabular
                // report), we locate the parameter keyword on a line and then use several
                // tolerant strategies (result-keyword proximity, single narrative number,
                // right-most table column, or look-ahead to a wrapped row) to pick out the
                // actual reading. The strongest (highest) qualifying reading per parameter per
                // page is kept, so one true exceedance isn't duplicated across multiple rows.
                // Each match also keeps the PDF-space bounding box(es) of its source line(s)
                // so the exact spot can be highlighted in red when the page is previewed.
                const pageBest = {}; // paramKey -> { value, snippet, boxes }
                lineObjs.forEach((lineObj, lineIdx) => {
                    const line = lineObj.text;
                    detectHeaderColumnOrder(line);
                    Object.keys(paramKeywordPatterns).forEach(paramKey => {
                        const industryLimit = limits[paramKey];
                        // A PM2.5 row also contains the phrase "particulate matter", which
                        // would otherwise also satisfy the generic PM/PM10 keyword — route
                        // it to the pm25 slot only, not both.
                        if (paramKey === "pm" && PM25_MARKER_RE.test(line)) return;
                        if (!paramKeywordPatterns[paramKey].test(line)) return;

                        const nextLineTexts = lineTexts.slice(lineIdx + 1, lineIdx + 3);
                        const found = findMeasuredValueForParam(line, nextLineTexts);
                        if (!found || isNaN(found.value)) return;

                        // Guard against obvious false positives: skip absurd values (e.g. a
                        // year or a page number picked up by mistake) that are wildly outside
                        // any plausible reading range.
                        if (found.value <= 0 || found.value > 100000) return;

                        // Prefer the limit the report itself prints alongside this exact
                        // reading (e.g. a lab test certificate's own "GPCB Norms" / "Norms
                        // as per GFR" / "Standard" column) over the generic per-industry
                        // stack-emission default. The printed figure is the authoritative,
                        // sample-type-specific one — the industry default assumes an mg/Nm3
                        // stack reading and doesn't apply to ambient-air, workplace, or
                        // effluent monitoring rows, which use different units and different
                        // limit sets entirely. Only fall back to the industry default when
                        // no row-printed limit could be confidently identified, and skip the
                        // row entirely if neither is available.
                        const effectiveLimit = (found.rowLimit != null) ? found.rowLimit : industryLimit;
                        if (effectiveLimit == null) return;

                        if (found.value > effectiveLimit) {
                            if (!pageBest[paramKey] || found.value > pageBest[paramKey].value) {
                                const boxes = [{ x0: lineObj.x0, y0: lineObj.y0, x1: lineObj.x1, y1: lineObj.y1 }];
                                if (found.nextLineIndex != null) {
                                    const extraObj = lineObjs[lineIdx + 1 + found.nextLineIndex];
                                    if (extraObj) boxes.push({ x0: extraObj.x0, y0: extraObj.y0, x1: extraObj.x1, y1: extraObj.y1 });
                                }
                                const unit = extractDisplayUnit(found.snippet) || (found.rowLimit != null ? null : "mg/Nm\u00b3");
                                pageBest[paramKey] = {
                                    value: found.value, snippet: found.snippet, boxes,
                                    limit: effectiveLimit,
                                    limitSource: found.rowLimit != null ? "document" : "industry",
                                    unit: unit
                                };
                            }
                        }
                    });

                    // ---- Custom (chemical / water / air) parameters ----
                    customDefs.forEach(def => {
                        const paramKey = `custom_${def.id}`;
                        if (!def.regex.test(line)) return;

                        const nextLineTexts = lineTexts.slice(lineIdx + 1, lineIdx + 3);
                        const found = findMeasuredValueForParam(line, nextLineTexts);
                        if (!found || isNaN(found.value)) return;
                        if (found.value <= 0 || found.value > 1000000) return;

                        if (found.value > def.limit) {
                            if (!pageBest[paramKey] || found.value > pageBest[paramKey].value) {
                                const boxes = [{ x0: lineObj.x0, y0: lineObj.y0, x1: lineObj.x1, y1: lineObj.y1 }];
                                if (found.nextLineIndex != null) {
                                    const extraObj = lineObjs[lineIdx + 1 + found.nextLineIndex];
                                    if (extraObj) boxes.push({ x0: extraObj.x0, y0: extraObj.y0, x1: extraObj.x1, y1: extraObj.y1 });
                                }
                                pageBest[paramKey] = { value: found.value, snippet: found.snippet, boxes, customDef: def };
                            }
                        }
                    });
                });

                Object.keys(pageBest).forEach(paramKey => {
                    const found = pageBest[paramKey];
                    if (found.customDef) {
                        const def = found.customDef;
                        violations.push({
                            parameter: paramKey,
                            label: `${def.name} (${CATEGORY_LABELS[def.category] || "Other"} \u00b7 Custom)`,
                            measured: found.value,
                            limit: def.limit,
                            unit: def.unit || "",
                            pdfPage: i,
                            printedPage: printedPage,
                            line: found.snippet.length > 160 ? found.snippet.slice(0, 160) + "\u2026" : found.snippet,
                            highlightBoxes: found.boxes,
                            isCustom: true
                        });
                        return;
                    }
                    violations.push({
                        parameter: paramKey,
                        label: paramPatterns[paramKey].label,
                        measured: found.value,
                        limit: found.limit,
                        limitSource: found.limitSource,
                        unit: found.unit || "mg/Nm\u00b3",
                        pdfPage: i,
                        printedPage: printedPage,
                        line: found.snippet.length > 160 ? found.snippet.slice(0, 160) + "\u2026" : found.snippet,
                        highlightBoxes: found.boxes
                    });
                });

                updateQueueProgress(docId, (i / totalPages) * 100);
                updateQueueMeta(docId, `Scanning page ${i} of ${totalPages}\u2026`);

                // Yield to the UI thread every ~15 pages so large (1000pg) files don't freeze the tab
                if (i % 15 === 0) await new Promise(r => setTimeout(r, 0));
            }

            return { totalPages, companyName, violations, companyNameChecks, previewBuffer, ocrPagesUsed };
        }

        async function runAuditOnDoc(docId, file, industryKey, companyOptions) {
            const authorityKeys = selectedAuthorities.slice();
            const { limits: effLimits, sources: limitSources } = getEffectiveLimits(industryKey);

            auditedDocs[docId] = {
                ...(auditedDocs[docId] || {}),
                name: file.name,
                sourceFile: file,
                industryKey,
                industryName: emissionStandards[industryKey].name,
                authorityKeys,
                authorityLabel: getSelectedAuthorityLabel(),
                effectiveLimits: effLimits,
                limitSources: limitSources,
                totalPages: 0,
                companyName: null,
                violations: [],
                companyNameChecks: [],
                status: "processing",
                previewBuffer: null
            };
            updateQueueStatus(docId, "Processing", "");
            updateQueueProgress(docId, 0);

            try {
                const customParamsSnapshot = customParams.map(p => ({ ...p }));
                const result = await auditPdfFile(file, industryKey, docId, companyOptions, effLimits, customParamsSnapshot);
                auditedDocs[docId].totalPages = result.totalPages;
                auditedDocs[docId].companyName = result.companyName;
                auditedDocs[docId].violations = result.violations.map(v => ({
                    ...v,
                    advice: rectificationAdvice[v.parameter] || (v.isCustom
                        ? "Cross-check this reading against the specific consent/EC condition and the applicable CPCB/IS test method for this parameter; investigate the source process and rectify accordingly."
                        : "Review against the applicable consent condition and investigate the source process.")
                }));
                auditedDocs[docId].companyNameChecks = result.companyNameChecks;
                auditedDocs[docId].previewBuffer = result.previewBuffer;
                auditedDocs[docId].ocrPagesUsed = result.ocrPagesUsed || 0;
                auditedDocs[docId].status = "done";
                auditedDocs[docId].lastScannedAt = new Date();

                const ocrNote = auditedDocs[docId].ocrPagesUsed > 0
                    ? ` \u00b7 OCR used on ${auditedDocs[docId].ocrPagesUsed} scanned page${auditedDocs[docId].ocrPagesUsed > 1 ? "s" : ""}`
                    : "";

                updateQueueProgress(docId, 100);
                if (result.violations.length === 0) {
                    updateQueueStatus(docId, "Compliant", "success");
                    updateQueueMeta(docId, `${result.totalPages} pages \u00b7 no exceedances${ocrNote}`);
                } else {
                    updateQueueStatus(docId, `${result.violations.length} issue${result.violations.length > 1 ? "s" : ""}`, "warning");
                    updateQueueMeta(docId, `${result.totalPages} pages \u00b7 ${result.violations.length} exceedance${result.violations.length > 1 ? "s" : ""} found${ocrNote}`);
                }
            } catch (err) {
                console.error("PDF audit failed for", file.name, err);
                auditedDocs[docId].status = "error";
                auditedDocs[docId].error = "Failed to parse this PDF (it may be scanned/image-only, password-protected, or corrupted).";
                updateQueueStatus(docId, "Error", "error");
                updateQueueMeta(docId, "Could not read file");
                updateQueueProgress(docId, 100);
            }
        }

        async function processFile(file, industryKey) {
            docCounter += 1;
            const docId = docCounter;
            createQueueItem(docId, file.name);

            const companyOptions = {
                expectedName: expectedCompanyInput ? expectedCompanyInput.value.trim() : "",
                aliases: companyAliasesInput
                    ? companyAliasesInput.value.split(",").map(a => a.trim()).filter(Boolean)
                    : [],
                ranges: cnParseRanges(companyPageRangeInput ? companyPageRangeInput.value : "")
            };
            auditedDocs[docId] = { companyOptions };

            await runAuditOnDoc(docId, file, industryKey, companyOptions);

            // Auto-show the first result, or the most recently finished one
            if (activeDocId === null || auditedDocs[docId].status !== "processing") {
                showReportForDoc(docId);
            }
        }

        // ---- Refresh Check: re-scan every already-uploaded PDF against the CURRENT
        // industry, regulatory authority(ies), manual limit overrides, and custom
        // parameters — without needing to re-upload the file. Handy after tweaking
        // settings post-upload. Mock/demo docs have no underlying file, so they're
        // left untouched (there's nothing real to re-scan).
        // `silent` suppresses the "nothing to refresh" alert — used by the automatic
        // trigger below so it doesn't pop up an alert on every keystroke before any
        // file has even been uploaded.
        async function refreshAllAudits(silent) {
            const docIds = Object.keys(auditedDocs).filter(id => auditedDocs[id] && auditedDocs[id].sourceFile);
            if (docIds.length === 0) {
                if (!silent) {
                    alert("No uploaded PDFs to refresh yet (mock/demo reports can't be re-scanned since there's no underlying file). Upload a PDF first.");
                }
                return;
            }
            if (refreshBtn) {
                refreshBtn.disabled = true;
                refreshBtn.classList.remove("pending-refresh");
                refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing\u2026';
            }
            for (const idStr of docIds) {
                const docId = parseInt(idStr, 10);
                const doc = auditedDocs[docId];
                // Always use the CURRENT dropdown selection — not the key snapshotted at
                // upload time — so changes to industry/authority/limits always take effect.
                const industryKey = industrySelect ? industrySelect.value : (doc.industryKey || "thermal-power-new");
                await runAuditOnDoc(docId, doc.sourceFile, industryKey, doc.companyOptions || {});
            }
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Refresh Check';
            }
            if (activeDocId !== null && auditedDocs[activeDocId]) {
                showReportForDoc(activeDocId);
            }
        }

        // Editing a limit/authority/custom-parameter after a PDF is already uploaded
        // used to require remembering to click "Refresh Check" — forget, and the
        // report keeps silently showing results from whatever limits were active at
        // the last check, which looks exactly like a false "fully compliant" reading.
        // Auto-triggering a (debounced) re-check on every relevant change removes that
        // trap entirely; it's debounced so rapid typing doesn't re-scan on every key.
        // A visible "re-checking" indicator also removes any ambiguity about whether
        // what's on screen right now reflects the settings currently entered.
        let autoRefreshTimer = null;
        function showPendingRefreshIndicator() {
            if (!refreshBtn) return;
            refreshBtn.classList.add("pending-refresh");
            refreshBtn.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i> Settings changed\u2026';
        }
        function clearPendingRefreshIndicator() {
            if (!refreshBtn) return;
            refreshBtn.classList.remove("pending-refresh");
            refreshBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Refresh Check';
        }
        function scheduleAutoRefreshCheck() {
            if (autoRefreshTimer) clearTimeout(autoRefreshTimer);
            const hasUploadedDocs = Object.keys(auditedDocs).some(id => auditedDocs[id] && auditedDocs[id].sourceFile);
            if (hasUploadedDocs) showPendingRefreshIndicator();
            autoRefreshTimer = setTimeout(() => {
                refreshAllAudits(true);
            }, 300);
        }

        if (refreshBtn) {
            refreshBtn.addEventListener("click", refreshAllAudits);
        }

        // Every field that affects what limits get checked — override inputs, industry
        // dropdown, authority chips — triggers an automatic re-scan so results are
        // always in sync with whatever is currently entered.
        const pdfIndustrySelect = document.getElementById("pdf-industry-select");
        [pdfIndustrySelect, overridePmInput, overridePm25Input, overrideSo2Input, overrideNoxInput, overrideCoInput].forEach(el => {
            if (!el) return;
            const evt = el.tagName === "SELECT" ? "change" : "input";
            el.addEventListener(evt, scheduleAutoRefreshCheck);
        });

        async function handleFiles(fileList) {
            const files = Array.from(fileList).filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
            if (files.length === 0) return;
            const industryKey = industrySelect ? industrySelect.value : "thermal-power-new";

            // Process sequentially so progress bars are meaningful and memory stays bounded on 1000+ page files
            for (const file of files) {
                await processFile(file, industryKey);
            }
        }

        // ---- Wire up multi-select Regulatory Authority chips (add via dropdown, remove via chip) ----
        function getSelectedAuthorityLabel() {
            if (selectedAuthorities.length === 0) return authorityInfo["cpcb"].label + " (default)";
            return selectedAuthorities.map(k => (authorityInfo[k] || authorityInfo["cpcb"]).label).join(", ");
        }

        function renderAuthorityChips() {
            if (!authorityChipsEl || !authorityNotesEl) return;

            authorityChipsEl.innerHTML = selectedAuthorities.length
                ? selectedAuthorities.map(key => {
                    const info = authorityInfo[key] || authorityInfo["cpcb"];
                    return `<span class="authority-chip" data-key="${key}" style="display:inline-flex; align-items:center; gap:6px; background:rgba(191,138,61,0.12); border:1px solid var(--border-glass); border-radius:20px; padding:4px 6px 4px 12px; font-size:11px; color:var(--text-primary);">
                        ${escapeHtml(info.label)}
                        <button type="button" class="chip-remove-btn" data-key="${key}" title="Remove" style="background:none; border:none; color:var(--text-dim); cursor:pointer; font-size:13px; line-height:1; padding:2px 4px;">&times;</button>
                    </span>`;
                }).join("")
                : `<span style="font-size:11px; color:var(--text-dim);">No authority selected &mdash; CPCB Schedule VI applied by default.</span>`;

            authorityNotesEl.innerHTML = (selectedAuthorities.length ? selectedAuthorities : ["cpcb"]).map(key => {
                const info = authorityInfo[key] || authorityInfo["cpcb"];
                return `<p class="input-help" style="margin-top: 6px; font-size: 11px; color: var(--text-dim);"><i class="fa-solid fa-circle-info"></i> <strong>${escapeHtml(info.label)}:</strong> ${info.note}</p>`;
            }).join("");

            authorityChipsEl.querySelectorAll(".chip-remove-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    selectedAuthorities = selectedAuthorities.filter(k => k !== btn.dataset.key);
                    renderAuthorityChips();
                    scheduleAutoRefreshCheck();
                });
            });
        }

        if (authorityAddSelect) {
            authorityAddSelect.addEventListener("change", () => {
                const val = authorityAddSelect.value;
                if (val && !selectedAuthorities.includes(val)) {
                    selectedAuthorities.push(val);
                    renderAuthorityChips();
                    scheduleAutoRefreshCheck();
                }
                authorityAddSelect.value = "";
            });
        }
        renderAuthorityChips();

        // ---- Wire up Custom Parameters (add via form, remove via chip) ----
        const CATEGORY_LABELS = { air: "Air/Stack", water: "Water/Effluent", soil: "Soil", other: "Other" };

        function renderCustomParamsList() {
            if (!customParamsListEl) return;
            customParamsListEl.innerHTML = customParams.length
                ? customParams.map(p => {
                    const unitTag = p.unit ? escapeHtml(p.unit) : "unit n/a";
                    return `<span class="authority-chip" data-id="${p.id}" style="display:inline-flex; align-items:center; gap:6px; background:rgba(79,122,99,0.14); border:1px solid var(--border-glass); border-radius:20px; padding:4px 6px 4px 12px; font-size:11px; color:var(--text-primary);">
                        <strong>${escapeHtml(p.name)}</strong>&nbsp;&middot;&nbsp;${CATEGORY_LABELS[p.category] || "Other"}&nbsp;&middot;&nbsp;&le; ${p.limit} ${unitTag}
                        <button type="button" class="custom-param-remove-btn" data-id="${p.id}" title="Remove" style="background:none; border:none; color:var(--text-dim); cursor:pointer; font-size:13px; line-height:1; padding:2px 4px;">&times;</button>
                    </span>`;
                }).join("")
                : `<span style="font-size:11px; color:var(--text-dim);">No custom parameters added &mdash; only PM/SO&#8322;/NOx/CO will be scanned.</span>`;

            customParamsListEl.querySelectorAll(".custom-param-remove-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    customParams = customParams.filter(p => String(p.id) !== btn.dataset.id);
                    renderCustomParamsList();
                    scheduleAutoRefreshCheck();
                });
            });
        }

        function addCustomParamFromInputs() {
            const name = customParamNameInput ? customParamNameInput.value.trim() : "";
            const limitRaw = customParamLimitInput ? customParamLimitInput.value : "";
            const limit = parseFloat(limitRaw);
            if (!name || isNaN(limit)) {
                alert("Enter both a parameter name and a numeric limit before adding.");
                return;
            }
            customParamCounter += 1;
            customParams.push({
                id: customParamCounter,
                name,
                category: customParamCategorySelect ? customParamCategorySelect.value : "other",
                unit: customParamUnitInput ? customParamUnitInput.value.trim() : "",
                limit
            });
            if (customParamNameInput) customParamNameInput.value = "";
            if (customParamUnitInput) customParamUnitInput.value = "";
            if (customParamLimitInput) customParamLimitInput.value = "";
            renderCustomParamsList();
            scheduleAutoRefreshCheck();
            // Keep focus in the form so the next parameter can be typed straight away
            if (customParamNameInput) customParamNameInput.focus();
        }

        if (addCustomParamBtnTop) {
            addCustomParamBtnTop.addEventListener("click", addCustomParamFromInputs);
        }
        // Press Enter in any of the custom-parameter fields to add it immediately,
        // so several parameters can be entered back-to-back without reaching for
        // the Add button each time.
        [customParamNameInput, customParamUnitInput, customParamLimitInput].forEach(input => {
            if (!input) return;
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomParamFromInputs();
                }
            });
        });
        renderCustomParamsList();

        // ---- Wire up upload zone (click-to-browse, drag & drop, multi-file input) ----
        uploadZone.addEventListener("click", () => fileInput.click());

        fileInput.addEventListener("change", (e) => {
            handleFiles(e.target.files);
            fileInput.value = ""; // allow re-uploading the same file again later
        });

        ["dragenter", "dragover"].forEach(evt => {
            uploadZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.style.borderColor = "var(--color-primary)";
                uploadZone.style.background = "rgba(191, 138, 61, 0.08)";
            });
        });

        ["dragleave", "drop"].forEach(evt => {
            uploadZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.style.borderColor = "";
                uploadZone.style.background = "";
            });
        });

        uploadZone.addEventListener("drop", (e) => {
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
                handleFiles(e.dataTransfer.files);
            }
        });

        // ---- Clear all reports ----
        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                Object.keys(auditedDocs).forEach(key => delete auditedDocs[key]);
                docCounter = 0;
                activeDocId = null;
                queueContainer.innerHTML = `<div class="empty-queue-text" style="font-size: 12px; color: var(--text-dim); text-align: center; padding: 20px 0;">No documents in queue. Upload PDFs or generate a mock to start.</div>`;
                if (reportDetails) reportDetails.classList.add("hidden");
                if (placeholder) placeholder.classList.remove("hidden");
                closePdfPreview();
            });
        }

        // ---- Mock simulation (no real file needed, for quick UI testing) ----
        function runMockAudit(withExceedance) {
            docCounter += 1;
            const docId = docCounter;
            const totalPages = withExceedance ? 800 : 500;
            const industryKey = industrySelect ? industrySelect.value : "thermal-power-new";
            const authorityKeys = selectedAuthorities.slice();
            const { limits, sources: limitSources } = getEffectiveLimits(industryKey);
            const filename = withExceedance ? "Mock_EIA_Report_800pg.pdf" : "Mock_EIA_Report_500pg_Compliant.pdf";

            createQueueItem(docId, filename);
            updateQueueStatus(docId, "Processing", "");

            const violations = [];
            if (withExceedance && limits.so2 != null) {
                violations.push({
                    parameter: "so2",
                    label: paramPatterns.so2.label,
                    measured: Math.round(limits.so2 * 1.6),
                    limit: limits.so2,
                    pdfPage: 412,
                    printedPage: 408,
                    line: `Ambient SO2 concentration recorded at stack outlet: ${Math.round(limits.so2 * 1.6)} mg/Nm3 during peak load testing.`,
                    advice: rectificationAdvice.so2
                });
                if (limits.pm != null) {
                    violations.push({
                        parameter: "pm",
                        label: paramPatterns.pm.label,
                        measured: Math.round(limits.pm * 1.3),
                        limit: limits.pm,
                        pdfPage: 415,
                        printedPage: 411,
                        line: `Particulate Matter (PM) at stack 2: ${Math.round(limits.pm * 1.3)} mg/Nm3, recorded during monsoon shutdown restart.`,
                        advice: rectificationAdvice.pm
                    });
                }
            }

            // Demo the proponent name check using whatever the user typed in, so the
            // feature is visible even without a real PDF. Mismatch/missing mock pages
            // only appear on the "with exceedance" mock, to illustrate both outcomes.
            const mockExpectedName = expectedCompanyInput ? expectedCompanyInput.value.trim() : "";
            const mockAliases = companyAliasesInput
                ? companyAliasesInput.value.split(",").map(a => a.trim()).filter(Boolean)
                : [];
            const mockRanges = cnParseRanges(companyPageRangeInput ? companyPageRangeInput.value : "");
            let mockCompanyNameChecks = [];
            if (mockExpectedName) {
                const mockPageSamples = withExceedance
                    ? [
                        { pdfPage: 1, printedPage: 1, text: `M/s Sample Thermal Power Corporation Ltd \u2014 Environmental Impact Assessment Report` },
                        { pdfPage: 45, printedPage: 41, text: `Annexure III: Stack emission monitoring data \u2014 Sample Thermal Power Corp.` },
                        { pdfPage: 412, printedPage: 408, text: `Consent to Operate issued to Smaple Thermal Power Corporation Ltd under the Air Act` },
                        { pdfPage: 600, printedPage: 596, text: `General project description, site layout, and surrounding land use details.` }
                      ]
                    : [
                        { pdfPage: 1, printedPage: 1, text: `M/s Greenline Compliant Industries Pvt Ltd \u2014 EIA Report` },
                        { pdfPage: 120, printedPage: 116, text: `Annexure II: Greenline Compliant Industries Pvt. Ltd. monitoring data` },
                        { pdfPage: 480, printedPage: 476, text: `Consent to Operate \u2014 Greenline Compliant Industries Pvt Ltd` }
                      ];
                mockPageSamples.forEach(sample => {
                    const check = checkPageForCompanyName(
                        sample.text, sample.pdfPage, sample.printedPage,
                        mockExpectedName, mockAliases, mockRanges
                    );
                    if (check) mockCompanyNameChecks.push(check);
                });
            }

            auditedDocs[docId] = {
                name: filename,
                industryKey,
                industryName: emissionStandards[industryKey].name,
                authorityKeys,
                authorityLabel: getSelectedAuthorityLabel(),
                effectiveLimits: limits,
                limitSources: limitSources,
                totalPages,
                companyName: withExceedance ? "M/s Sample Thermal Power Corporation Ltd" : "M/s Greenline Compliant Industries Pvt Ltd",
                violations,
                companyNameChecks: mockCompanyNameChecks,
                status: "processing",
                previewBuffer: null
            };

            let progress = 0;
            const interval = setInterval(() => {
                progress += 100 / 14;
                updateQueueProgress(docId, progress);
                updateQueueMeta(docId, `Scanning page ${Math.min(totalPages, Math.round((progress / 100) * totalPages))} of ${totalPages}\u2026`);
                if (progress >= 100) {
                    clearInterval(interval);
                    auditedDocs[docId].status = "done";
                    if (violations.length === 0) {
                        updateQueueStatus(docId, "Compliant", "success");
                        updateQueueMeta(docId, `${totalPages} pages \u00b7 no exceedances`);
                    } else {
                        updateQueueStatus(docId, `${violations.length} issues`, "warning");
                        updateQueueMeta(docId, `${totalPages} pages \u00b7 ${violations.length} exceedances found`);
                    }
                    showReportForDoc(docId);
                }
            }, 120);
        }

        if (mockBtn) mockBtn.addEventListener("click", () => runMockAudit(true));
        if (mockCompliantBtn) mockCompliantBtn.addEventListener("click", () => runMockAudit(false));
    })();

    // ==========================================
    // INITIALIZATION ROUTINES
    // ==========================================
    initChart();
    runEmissionsAudit();
    initMap();
    // Start with preset Sanjay Gandhi NP on screen
    runGisScreener(19.2980, 72.8420, "Mumbai Western Suburb Site");
});