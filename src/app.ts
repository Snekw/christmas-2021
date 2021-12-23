import { lightningChart, emptyFill, emptyLine, PalettedFill, LUT, ColorHEX, UIElementBuilders, UIBackgrounds, UIOrigins, LinearGradientFill, translatePoint, AutoCursorModes } from "@arction/lcjs"

const font = new FontFace(`'Love Light'`, 'url(static/LoveLight-Regular.ttf)')
font.load().then(() => {
    const lc = lightningChart({ warnings: false })

    const chart = lc.ChartXY({
        disableAnimations: true,
    })

    chart.setTitle('').setTitleFillStyle(emptyFill).setPadding(0).setAutoCursorMode(AutoCursorModes.disabled)

    const axisX = chart.getDefaultAxisX()

    axisX.setTickStrategy('Empty').setNibStyle(emptyLine).setStrokeStyle(emptyLine)

    const axisY = chart.getDefaultAxisY()

    axisY.setTickStrategy('Empty').setNibStyle(emptyLine).setStrokeStyle(emptyLine)

    const resolutionX = 500
    const resolutionY = 500

    // #region Ground

    const ground = chart
        .addHeatmapGridSeries({
            columns: resolutionX,
            rows: resolutionY,
            dataOrder: 'columns',
            start: { x: 0, y: 0 },
            end: { x: 1, y: 1 },
        })
        .setName('ground')
        .setWireframeStyle(emptyLine)
        .setIntensityInterpolation('bilinear')
        .setFillStyle(
            new PalettedFill({
                lookUpProperty: 'value',
                lut: new LUT({
                    steps: [
                        { value: 0, color: ColorHEX('#82B9BB') },
                        { value: 1, color: ColorHEX('#ededeb') },
                    ],
                    interpolate: true,
                }),
            }),
        )

    const groundData = Array.from(Array(resolutionX)).map(() => Array.from(Array(resolutionY)))
    for (let x = 0; x < resolutionX; x += 1) {
        for (let y = 0; y < resolutionY; y += 1) {
            groundData[x][y] = 0
            if (y < Math.sin(x / 10) * Math.cos(y) * 20 + 100) {
                groundData[x][y] = 1
            }
        }
    }

    ground.invalidateIntensityValues(groundData)
    // #endregion

    // #region Trees

    const createTreeLayer = (xOff: number, yOff: number, scale: number) => {
        const tree = chart
            .addHeatmapGridSeries({
                columns: 50,
                rows: 80,
                dataOrder: 'columns',
                start: { x: xOff, y: 0.1 + yOff },
                end: { x: 0.15 * scale + xOff, y: 0.6 * scale + yOff },
            })
            .setName('tree')
            .setWireframeStyle(emptyLine)
            .setIntensityInterpolation('bilinear')
            .setFillStyle(
                new PalettedFill({
                    lookUpProperty: 'value',
                    lut: new LUT({
                        steps: [
                            { value: 0, color: ColorHEX('#B1E3E700') },
                            { value: 0.1, color: ColorHEX('#5F2914') },
                            { value: 0.5, color: ColorHEX('#126910') },
                            { value: 0.5, color: ColorHEX('#126910') },
                            { value: 0.9, color: ColorHEX('#f00') },
                            { value: 1, color: ColorHEX('#f00') },
                        ],
                        interpolate: true,
                    }),
                }),
            )

        const treeData = Array.from(Array(50)).map(() => Array.from(Array(80)).fill(0))

        for (let x = 0; x < 50; x += 1) {
            for (let y = 0; y < 80; y += 1) {
                treeData[x][y] = 0
                // trunk
                if (x > (50 / 5) * 2 && x < (50 / 5) * 3 && y < 20) {
                    treeData[x][y] = 0.1
                }
                if (y > 10) {
                    if (y < 30 && x + 10 > y && 50 - x + 10 > y) {
                        treeData[x][y] = 0.5
                    }
                }
                if (y > 25) {
                    if (y < 50 && x + 10 > y - 10 && 50 - x + 10 > y - 10) {
                        treeData[x][y] = 0.5
                    }
                }
                if (y > 40) {
                    if (y < 80 && x + 10 > y - 20 && 50 - x + 10 > y - 20) {
                        treeData[x][y] = 0.5
                    }
                }

                if (Math.random() > 0.95 && treeData[x][y] === 0.5) {
                    treeData[x][y] = 1
                }
            }
        }
        tree.invalidateIntensityValues(treeData)
    }

    const trees = [
        createTreeLayer(0.1, 0.05, 1),
        createTreeLayer(0.25, 0.1, 0.8),
        createTreeLayer(0.3, 0, 1.2),
        createTreeLayer(0.52, 0.01, 1.1),
        createTreeLayer(0.7, 0.05, 1.1),
    ]

    // #endregion

    // #region Merry Christmas

    const letters = 'Merry Christmas!'.split('')

    const letterObjects = letters.map((letter, i) =>
        chart
            .addUIElement(UIElementBuilders.TextBox.setBackground(UIBackgrounds.None), ground.scale)
            .setOrigin(UIOrigins.LeftBottom)
            .setText(letter)
            .setTextFont((f) => f.setSize((chart.engine.container.offsetWidth / letters.length) * 2 * 0.7).setFamily(`'Love Light'`))
            .setPadding(0)
            .setMargin(0)
            .setTextFillStyle(
                new LinearGradientFill({
                    stops: [
                        { offset: 0, color: ColorHEX('#dc2b2e') },
                        { offset: 1, color: ColorHEX('#a02529') },
                    ],
                }),
            ),
    )

    let timeOffset = 0
    let lastFrame = 0
    const update = (timestamp: number) => {
        const delta = (lastFrame - timestamp) / 1000
        let offsetSoFar = 0
        letterObjects.forEach((letter, i) => {
            letter.setPosition({ x: 0.1 + offsetSoFar, y: 0.7 + Math.sin((i + timeOffset) / (letterObjects.length / 6)) * 0.1 })
            const size = letter.getSize()
            offsetSoFar += translatePoint(size, chart.pixelScale, ground.scale).x
        })
        timeOffset += delta
        lastFrame = timestamp
        requestAnimationFrame(update)
    }
    requestAnimationFrame(update)
    // #endregion

    // #region Snow fall

    const createSnowLayer = (nFlakes: number) => {
        const snow = chart
            .addHeatmapGridSeries({
                columns: 100,
                rows: 100,
                dataOrder: 'columns',
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            })
            .setName('snow')
            .setWireframeStyle(emptyLine)
            .setIntensityInterpolation('bilinear')
            .setFillStyle(
                new PalettedFill({
                    lookUpProperty: 'value',
                    lut: new LUT({
                        steps: [
                            { value: 0, color: ColorHEX('#B1E3E700') },
                            { value: 0.95, color: ColorHEX('#ffff') },
                            { value: 1, color: ColorHEX('#ffff') },
                        ],
                        interpolate: true,
                    }),
                }),
            )

        const snowData = Array.from(Array(100)).map(() => Array.from(Array(99)).fill(0))
        const nSnowFlakes = nFlakes
        const snowFlakes = Array.from(Array(nSnowFlakes))
        for (let i = 0; i < nSnowFlakes; i += 1) {
            snowFlakes[i] = { x: Math.floor(Math.random() * 99), y: Math.floor(Math.random() * 79) + 20 }
        }

        const updateSnowFlakes = () => {
            snowData.forEach((row) => row.fill(0))

            snowFlakes.forEach((flake) => {
                if ((flake.y / 100) * resolutionY > Math.cos((flake.y / 100) * resolutionY) * 20 + 100) {
                    snowData[flake.x][Math.min(flake.y, 100)] = 1
                    if (Math.random() > 0.5) {
                        flake.y -= Math.floor(Math.random() * 3)
                    }
                    if (Math.random() > 0.9) {
                        flake.x += Math.floor(Math.random() * 3) * Math.sign(Math.random() > 0.5 ? -1 : 1)
                        if (flake.x < 0) {
                            flake.x = 99
                        } else if (flake.x > 99) {
                            flake.x = 0
                        }
                    }
                } else {
                    flake.x = Math.floor(Math.random() * 100)
                    flake.y = 100
                }
            })

            snow.invalidateIntensityValues(snowData)
        }
        return {
            updateSnowFlakes,
        }
    }

    const snowLayers = Array.from(Array(5)).map(() => createSnowLayer(50))

    setInterval(() => {
        snowLayers.forEach((layer) => {
            if (Math.random() > 0.5) {
                layer.updateSnowFlakes()
            }
        })
    }, 200)

    // #endregion
})
