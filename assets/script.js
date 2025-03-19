// Hàm drawBarChart để vẽ biểu đồ
function drawBarChart(containerId, data, options = {}) {
    const defaultOptions = {
        width: 1000,
        height: 500,
        margin: { top: 50, right: 70, bottom: 150, left: 300 },
        colorScheme: d3.schemeTableau10.concat(d3.schemeSet3),
        horizontal: true,
    };
    const config = { ...defaultOptions, ...options };
    const { width, height, margin, colorScheme, horizontal } = config;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous SVG
    d3.select(`#${containerId}`).select("svg").remove();

    // Create SVG
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define scales
    let x, y;
    if (horizontal) {
        x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d["Doanh thu"]) || 0])
            .nice()
            .range([0, chartWidth]);

        y = d3.scaleBand()
            .domain(data.map(d => d["Tên"]))
            .range([0, chartHeight])
            .padding(0.2);
    } else {
        if (containerId === "chart11" || containerId === "chart12") {
            // Histogram: Use scaleLinear for X-axis to make bars adjacent
            const maxIndex = data.length; // Số lượng bins hoặc số lần mua tối đa
            x = d3.scaleLinear()
                .domain([0, maxIndex])
                .range([0, chartWidth]);
        } else {
            x = d3.scaleBand()
                .domain(data.map(d => d["Tên"]))
                .range([0, chartWidth])
                .padding(0.2);
        }

        y = d3.scaleLinear()
            .domain([0, d3.max(data, d => parseFloat(d["Doanh thu"])) || 0])
            .nice()
            .range([chartHeight, 0]);
    }

    // Define uniqueGroups and groupTotals for all cases
    const uniqueGroups = [...new Set(data.map(d => d["Nhóm hàng gộp"] || d["Nhóm hàng"]))];
    const groupTotals = d3.rollup(
        data,
        v => d3.sum(v, d => d["Doanh thu"]),
        d => d["Nhóm hàng gộp"] || d["Nhóm hàng"]
    );

    // Create a color scale
    let colorScale;
    if (containerId === "chart3" || containerId === "chart4" || containerId === "chart5" || containerId === "chart6" || containerId === "chart7" || containerId.startsWith("chart9-sub") || containerId.startsWith("chart10-sub")) {
        colorScale = d3.scaleOrdinal()
            .domain(data.map(d => d["Tên"]))
            .range(colorScheme || d3.schemePastel1);
    } else {
        colorScale = d3.scaleOrdinal()
            .domain(uniqueGroups)
            .range(colorScheme);
    }

    // Add axes
    if (horizontal) {
        svg.append("g")
            .attr("transform", `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x)
                .tickFormat(d => {
                    if (containerId === "chart6") return `${d / 1e3}K`;
                    if (containerId === "chart7") return `${(d * 100).toFixed(1)}%`;
                    if (containerId.startsWith("chart9-sub")) return `${(d * 100).toFixed(1)}%`;
                    return `${d / 1e6}M`;
                })
            );
        svg.append("text")
            .attr("x", chartWidth / 2)
            .attr("y", chartHeight + 40)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text(containerId === "chart7" ? "%" : " ");
        svg.append("g").call(d3.axisLeft(y));
    } else {
        svg.append("g")
            .attr("transform", `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x)
                .tickFormat((d, i) => {
                    if (containerId === "chart11") return parseInt(d);
                    if (containerId === "chart12") return data[i] ? data[i]["Tên"] : "";
                    if (containerId === "chart7") return `${(d * 100).toFixed(1)}%`;
                    if (containerId.startsWith("chart9-sub")) return `${(d * 100).toFixed(1)}%`;
                    if (containerId === "chart5" && typeof d === "string") {
                        if (d.startsWith("Y ")) {
                            return d.replace("Y ", "Ngày ");
                        } else if (d.startsWith("Ng%y")) {
                            return d.replace("Ng%y", "Ngày");
                        }
                        return d;
                    }
                    return d;
                })
            )
            .selectAll("text")
            .attr("transform", d => {
                if (containerId === "chart5" || containerId === "chart12") {
                    return "rotate(-45)";
                }
                return null;
            })
            .attr("text-anchor", d => (containerId === "chart5" || containerId === "chart12") ? "end" : "middle")
            .attr("dy", d => (containerId === "chart5" || containerId === "chart12") ? "0em" : "0.71em")
            .attr("dx", d => (containerId === "chart5" || containerId === "chart12") ? "-5px" : "0")
            .style("font-size", "10px");

        svg.append("g")
            .call(d3.axisLeft(y)
                .ticks(5)
                .tickFormat(d => {
                    if (containerId === "chart11" || containerId === "chart12") return parseInt(d);
                    if (containerId === "chart6") return `${d / 1e3}K`;
                    return `${d / 1e6}M`;
                }));
    }

    // Draw bars
    svg.selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr(horizontal ? "y" : "x", (d, i) => {
            if (horizontal) return y(d["Tên"]);
            if (containerId === "chart11" || containerId === "chart12") return x(i);
            return x(d["Tên"]);
        })
        .attr(horizontal ? "x" : "y", d => horizontal ? 0 : y(parseFloat(d["Doanh thu"])))
        .attr(horizontal ? "width" : "height", d => horizontal ? x(parseFloat(d["Doanh thu"])) : chartHeight - y(parseFloat(d["Doanh thu"])))
        .attr(horizontal ? "height" : "width", (d, i) => {
            if (horizontal) return y.bandwidth();
            if (containerId === "chart11" || containerId === "chart12") {
                return chartWidth / data.length;
            }
            return x.bandwidth();
        })
        .attr("fill", d => (containerId === "chart11" || containerId === "chart12") ? "#4CAF50" : colorScale(containerId === "chart3" || containerId === "chart4" || containerId === "chart5" || containerId === "chart6" || containerId === "chart7" || containerId.startsWith("chart9-sub") || containerId.startsWith("chart10-sub") ? d["Tên"] : (d["Nhóm hàng gộp"] || d["Nhóm hàng"])))
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget)
                .attr("fill", d3.color((containerId === "chart11" || containerId === "chart12") ? "#4CAF50" : colorScale(containerId === "chart3" || containerId === "chart4" || containerId === "chart5" || containerId === "chart6" || containerId === "chart7" || containerId.startsWith("chart9-sub") || containerId.startsWith("chart10-sub") ? d["Tên"] : (d["Nhóm hàng gộp"] || d["Nhóm hàng"]))).brighter(0.8));

            const isChart4 = !!event.currentTarget.closest("#chart4");
            const isChart5 = !!event.currentTarget.closest("#chart5");
            const isChart6 = !!event.currentTarget.closest("#chart6");
            const isChart9 = containerId.startsWith("chart9-sub");
            const isChart10 = containerId.startsWith("chart10-sub");
            const isChart11 = containerId === "chart11";
            const isChart12 = containerId === "chart12";

            let label = (horizontal ? "Mặt hàng" : "Tháng");
            if (isChart6) label = "Khung giờ";
            if (isChart5) label = "Ngày trong tháng";
            if (isChart4) label = "Ngày trong tuần";
            if (isChart9) label = "Mặt hàng";
            if (isChart11) label = "Số lượt mua";
            if (isChart12) label = "Lượng chi tiêu";

            let doanhThuText;
            if (isChart11 || isChart12) {
                doanhThuText = `${parseInt(d["Doanh thu"])} khách hàng`;
            } else {
                const formatOptions = {
                    chart6: `${parseFloat(d["Doanh thu"]).toFixed(1)} VND`,
                    chart7: `${(parseFloat(d["Doanh thu"]) * 100).toFixed(1)}%`,
                    chart9: `${(parseFloat(d["Doanh thu"]) * 100).toFixed(1)}%`,
                    default: `${(parseFloat(d["Doanh thu"]) / 1e6).toFixed(1)} triệu VND`
                };
                doanhThuText = formatOptions[containerId] || formatOptions.default;
            }

            tooltip.style("visibility", "visible")
                .html(`
                    <strong>${label}:</strong> ${d["Tên"]} <br>
                    <strong>${(isChart11 || isChart12) ? "Số lượng khách hàng" : "Doanh thu"}:</strong> ${doanhThuText}
                `);
        })
        .on("mousemove", (event) => {
            tooltip.style("top", (event.pageY - 10) + "px")
                   .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", (event, d) => {
            d3.select(event.currentTarget)
                .attr("fill", (containerId === "chart11" || containerId === "chart12") ? "#4CAF50" : colorScale(containerId === "chart3" || containerId === "chart4" || containerId === "chart5" || containerId === "chart6" || containerId === "chart7" || containerId.startsWith("chart9-sub") || containerId.startsWith("chart10-sub") ? d["Tên"] : (d["Nhóm hàng gộp"] || d["Nhóm hàng"])));
            tooltip.style("visibility", "hidden");
        });

    // Add text labels for revenue
    svg.selectAll("text.bar-label")
        .data(data)
        .enter().append("text")
        .attr("class", "bar-label")
        .attr("x", (d, i) => {
            if (horizontal) return x(parseFloat(d["Doanh thu"])) + 5;
            if (containerId === "chart11" || containerId === "chart12") {
                return x(i) + (chartWidth / data.length) / 2;
            }
            return x(d["Tên"]) + x.bandwidth() / 2;
        })
        .attr("y", d => horizontal ? y(d["Tên"]) + y.bandwidth() / 2 : y(parseFloat(d["Doanh thu"])) - 10)
        .style("font-size", "7px")
        .attr("text-anchor", horizontal ? "start" : "middle")
        .text(d => {
            if (containerId === "chart7" || containerId.startsWith("chart9-sub")) {
                return `${(parseFloat(d["Doanh thu"]) * 100).toFixed(1)}%`;
            }
            if (containerId === "chart11" || containerId === "chart12") {
                return parseInt(d["Doanh thu"]);
            }
            if (containerId === "chart6") {
                return `${parseFloat(d["Doanh thu"]).toFixed(1)} VND`;
            }
            return `${(parseFloat(d["Doanh thu"]) / 1e6).toFixed(1)} triệu VND`;
        })
        .attr("fill", "black");

    // Create a tooltip
    let tooltip = d3.select("#tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("id", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("border", "1px solid #444")
            .style("padding", "8px")
            .style("border-radius", "5px")
            .style("box-shadow", "2px 2px 10px rgba(0,0,0,0.3)")
            .style("visibility", "hidden")
            .style("font-size", "14px")
            .style("z-index", "9999");
    }

    // Add a legend (skip for chart11 and chart12)
    if (containerId !== "chart3" && containerId !== "chart4" && containerId !== "chart5" && containerId !== "chart6" && containerId !== "chart7" && !containerId.startsWith("chart9-sub") && !containerId.startsWith("chart10-sub") && containerId !== "chart11" && containerId !== "chart12") {
        const legend = svg.append("g")
            .attr("transform", `translate(${chartWidth + 20}, 0)`);

        uniqueGroups.forEach((group, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);

            legendRow.append("rect")
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", colorScale(group));

            const total = (groupTotals.get(group) / 1e6).toFixed(1);
            legendRow.append("text")
                .attr("x", 20)
                .attr("y", 12)
                .text(group)
                .attr("font-size", "8px");
        });
    }
}

// Tải dữ liệu và chuẩn bị các tập dữ liệu
d3.json("assets/data.json").then(data => {
    // Tạo ánh xạ tên nhóm hàng
    const groupNameMap = new Map();
    data.forEach(d => {
        groupNameMap.set(d["Mã nhóm hàng"], d["Tên nhóm hàng"]);
    });

    // Tạo dữ liệu cho chart1: Doanh thu theo mặt hàng
    const doanhThuTheoMatHang = d3.rollup(
        data,
        v => ({
            total: d3.sum(v, d => d["Thành tiền"]),
            group: `${v[0]["Mã nhóm hàng"]} - ${v[0]["Tên nhóm hàng"]}`
        }),
        d => `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`
    );

    window.dataMatHang = Array.from(doanhThuTheoMatHang, ([name, { total, group }]) => ({
        "Tên": name,
        "Doanh thu": total,
        "Nhóm hàng gộp": group
    })).sort((a, b) => b["Doanh thu"] - a["Doanh thu"]);

    // Tạo dữ liệu cho chart2: Doanh thu theo nhóm hàng (tổng hợp theo nhóm)
    const doanhThuTheoNhomHang = d3.rollup(
        data,
        v => d3.sum(v, d => d["Thành tiền"]),
        d => `${d["Mã nhóm hàng"]} - ${d["Tên nhóm hàng"]}`
    );
    window.dataNhomHang = Array.from(doanhThuTheoNhomHang, ([name, total]) => ({
        "Tên": name,
        "Doanh thu": total,
        "Nhóm hàng": name
    })).sort((a, b) => b["Doanh thu"] - a["Doanh thu"]);

    // chart3
    const doanhThuTheoThang = d3.rollup(
        data,
        v => d3.sum(v, d => d["Thành tiền"]),
        d => {
            const date = new Date(d["Thời gian tạo đơn"]);
            return `Tháng ${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
    );
    window.dataTheoThang = Array.from(doanhThuTheoThang, ([month, total]) => ({
        "Tên": month,
        "Doanh thu": total,
        "Nhóm hàng": "Tháng"
    })).sort((a, b) => parseInt(a["Tên"].split(" ")[1]) - parseInt(b["Tên"].split(" ")[1]));

    // chart4
    const doanhThuTheoNgayTrongTuan = d3.rollup(
        data,
        v => ({
            total: d3.sum(v, d => d["Thành tiền"]),
            soNgay: new Set(v.map(d => new Date(d["Thời gian tạo đơn"]).toISOString().split('T')[0])).size
        }),
        d => {
            const dateStr = d["Thời gian tạo đơn"];
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                console.warn(`Ngày không hợp lệ: ${dateStr}, bỏ qua`);
                return "Không xác định";
            }
            const dayIndex = date.getDay();
            const daysOfWeek = [
                "Chủ Nhật",
                "Thứ Hai",
                "Thứ Ba",
                "Thứ Tư",
                "Thứ Năm",
                "Thứ Sáu",
                "Thứ Bảy"
            ];
            return daysOfWeek[dayIndex];
        }
    );
    window.dataTheoNgayTrongTuan = Array.from(doanhThuTheoNgayTrongTuan, ([day, { total, soNgay }]) => ({
        "Tên": day,
        "Doanh thu": total / soNgay,
        "Nhóm hàng": "Ngày"
    }))
    .filter(d => d["Tên"] !== "Không xác định");

    const allDays = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
    window.dataTheoNgayTrongTuan = allDays.map(day => {
        const found = window.dataTheoNgayTrongTuan.find(d => d["Tên"] === day);
        return found || { "Tên": day, "Doanh thu": 0, "Nhóm hàng": "Ngày" };
    });

    window.dataTheoNgayTrongTuan.sort((a, b) => {
        return allDays.indexOf(a["Tên"]) - allDays.indexOf(b["Tên"]);
    });

    // chart5
    const doanhThuTrungBinhTheoNgay = d3.rollup(
        data,
        v => ({
            total: d3.sum(v, d => d["Thành tiền"]),
            soNgay: new Set(v.map(d => {
                const date = new Date(d["Thời gian tạo đơn"]);
                return date.getMonth() + 1;
            })).size
        }),
        d => {
            const date = new Date(d["Thời gian tạo đơn"]);
            return `Ngày ${String(date.getDate()).padStart(2, '0')}`;
        }
    );
    
    window.dataTheoNgayTrongThang = Array.from(doanhThuTrungBinhTheoNgay, ([day, { total, soNgay }]) => ({
        "Tên": day,
        "Doanh thu": soNgay > 0 ? total / soNgay : 0,
        "Nhóm hàng": "Ngày"
    })).sort((a, b) => parseInt(a["Tên"].split(" ")[1]) - parseInt(b["Tên"].split(" ")[1]));

    // chart6
    const doanhThuTheoKhungGio = d3.rollup(
        data,
        v => {
            const validValues = v.filter(d => d["Thành tiền"] != null && !isNaN(d["Thành tiền"]));
            return {
                tongDoanhThu: d3.sum(validValues, d => d["Thành tiền"]) || 0,
                soNgay: new Set(validValues.map(d => {
                    const date = new Date(d["Thời gian tạo đơn"]);
                    return isNaN(date.getTime()) ? null : d3.timeFormat("%Y-%m-%d")(date);
                })).size || 1
            };
        },
        d => {
            const date = new Date(d["Thời gian tạo đơn"]);
            const hour = isNaN(date.getTime()) ? 0 : date.getHours();
            return `${hour.toString().padStart(2, "0")}:00-${hour.toString().padStart(2, "0")}:59`;
        }
    );
    window.dataTheoKhungGio = Array.from(doanhThuTheoKhungGio, ([khungGio, { tongDoanhThu, soNgay }]) => ({
        "Tên": khungGio,
        "Doanh thu": tongDoanhThu / soNgay,
        "Nhóm hàng": "Giờ"
    })).sort((a, b) => parseInt(a["Tên"].split(":")[0]) - parseInt(b["Tên"].split(":")[0]));

    // chart7
    const tongSoDonHang = new Set(data.map(d => d["Mã đơn hàng"])).size;
    const dataTyLeNhomHangg = d3.rollup(
        data,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => `${d["Mã nhóm hàng"]} - ${d["Tên nhóm hàng"]}`
    );

    window.dataTyLeNhomHang = Array.from(dataTyLeNhomHangg, ([name, total]) => ({
        "Tên": name,
        "Doanh thu": total / tongSoDonHang,
        "Nhóm hàng": "name"
    })).sort((a, b) => b["Doanh thu"] - a["Doanh thu"]);

    // chart8
    const months = Array.from(new Set(data.map(d => {
        const date = new Date(d["Thời gian tạo đơn"]);
        if (!isNaN(date.getTime())) {
            const month = date.getMonth() + 1;
            return `Tháng ${month < 10 ? '0' + month : month}`;
        }
        return null;
    }).filter(d => d))).sort((a, b) => parseInt(a.split(" ")[1]) - parseInt(b.split(" ")[1]));

    const totalOrdersByMonth = d3.rollup(
        data,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => {
            const date = new Date(d["Thời gian tạo đơn"]);
            if (!isNaN(date.getTime())) {
                const month = date.getMonth() + 1;
                return `Tháng ${month < 10 ? '0' + month : month}`;
            }
            return "Không xác định";
        }
    );

    const groupedDataByMonthAndCategory = d3.rollup(
        data,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => {
            const date = new Date(d["Thời gian tạo đơn"]);
            if (!isNaN(date.getTime())) {
                const month = date.getMonth() + 1;
                return `Tháng ${month < 10 ? '0' + month : month}`;
            }
            return "Không xác định";
        },
        d => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`
    );

    const categories = Array.from(new Set(data.map(d => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`)));

    const dataForChart8 = months.map(month => {
        const monthData = { "Tháng": month };
        groupedDataByMonthAndCategory.get(month)?.forEach((orderCount, category) => {
            const totalOrders = totalOrdersByMonth.get(month) || 1;
            monthData[category] = orderCount / totalOrders;
        });
        categories.forEach(category => {
            if (monthData[category] === undefined) {
                monthData[category] = 0;
            }
        });
        return monthData;
    });

    window.dataXacSuatThang = dataForChart8;
    console.log("Data for chart8:", window.dataXacSuatThang);

    // chart9
    function prepareChartData9(data, selectedGroup) {
        const filteredData = data.filter(d => d["Mã nhóm hàng"] === selectedGroup);
        if (!filteredData || filteredData.length === 0) {
            console.warn(`Không có dữ liệu cho nhóm hàng ${selectedGroup}`);
            return [];
        }
        const totalOrders = new Set(filteredData.map(d => d["Mã đơn hàng"])).size || 1;
        const ordersByItem = d3.rollup(
            filteredData,
            v => new Set(v.map(d => d["Mã đơn hàng"])).size,
            d => `${d["Mã mặt hàng"]} - ${d["Tên mặt hàng"]}`
        );
        const processedData = Array.from(ordersByItem, ([item, count]) => ({
            "Tên": item,
            "Doanh thu": (count / totalOrders) * 100
        })).sort((a, b) => b["Doanh thu"] - a["Doanh thu"]);
        return processedData;
    }

    const allGroups = Array.from(new Set(data.map(d => d["Mã nhóm hàng"])));
    if (!allGroups || allGroups.length === 0) {
        console.error("Không tìm thấy nhóm hàng nào trong dữ liệu:", data);
    }
    console.log("All Groups for chart9:", allGroups);

    window.dataXacSuatNhomHangTheoThang = allGroups.map(group => ({
        group: group,
        groupName: groupNameMap.get(group) || "Không có tên",
        data: prepareChartData9(data, group)
    }));
    console.log("Data for chart9:", window.dataXacSuatNhomHangTheoThang);

    // chart10
    function prepareChartData10(data, selectedGroup) {
        const filteredData = data.filter(d => d["Mã nhóm hàng"] === selectedGroup);
        if (!filteredData || filteredData.length === 0) {
            console.warn(`Không có dữ liệu cho nhóm hàng ${selectedGroup}`);
            return [];
        }

        const allMonths = Array.from(new Set(filteredData.map(d => {
            const date = new Date(d["Thời gian tạo đơn"]);
            if (!isNaN(date.getTime())) {
                const month = date.getMonth() + 1;
                return `Tháng ${month < 10 ? '0' + month : month}`;
            }
            return null;
        }).filter(d => d))).sort((a, b) => parseInt(a.split(" ")[1]) - parseInt(b.split(" ")[1]));

        const allItems = Array.from(new Set(filteredData.map(d => `${d["Mã mặt hàng"]} - ${d["Tên mặt hàng"]}`)));

        const totalOrdersByMonth = d3.rollup(
            filteredData,
            v => new Set(v.map(d => d["Mã đơn hàng"])).size,
            d => {
                const date = new Date(d["Thời gian tạo đơn"]);
                if (!isNaN(date.getTime())) {
                    const month = date.getMonth() + 1;
                    return `Tháng ${month < 10 ? '0' + month : month}`;
                }
                return "Không xác định";
            }
        );

        const ordersByMonthAndItem = d3.rollup(
            filteredData,
            v => new Set(v.map(d => d["Mã đơn hàng"])).size,
            d => {
                const date = new Date(d["Thời gian tạo đơn"]);
                if (!isNaN(date.getTime())) {
                    const month = date.getMonth() + 1;
                    return `Tháng ${month < 10 ? '0' + month : month}`;
                }
                return "Không xác định";
            },
            d => `${d["Mã mặt hàng"]} - ${d["Tên mặt hàng"]}`
        );

        const processedData = allMonths.map(month => {
            const monthData = { "Tháng": month };
            const totalOrders = totalOrdersByMonth.get(month) || 1;

            allItems.forEach(item => {
                const orderCount = ordersByMonthAndItem.get(month)?.get(item) || 0;
                monthData[item] = (orderCount / totalOrders) * 100;
            });

            return monthData;
        });

        return processedData;
    }

    const allGroupsss = Array.from(new Set(data.map(d => d["Mã nhóm hàng"])));
    if (!allGroupsss || allGroupsss.length === 0) {
        console.error("Không tìm thấy nhóm hàng nào trong dữ liệu:", data);
    }
    console.log("All Groups for chart10:", allGroupsss);

    window.dataXacSuatNhomHangTheoThangss = allGroupsss.map(group => ({
        group: group,
        groupName: groupNameMap.get(group) || "Không có tên",
        data: prepareChartData10(data, group)
    }));
    console.log("Data for chart10:", window.dataXacSuatNhomHangTheoThangss);

    // chart11
    const ordersByCustomer = d3.rollup(
        data,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => d["Mã khách hàng"]
    );

    const purchaseDistribution = d3.rollup(
        Array.from(ordersByCustomer, ([customer, count]) => count),
        v => v.length,
        d => d
    );

    window.dataPurchaseDistribution = Array.from(purchaseDistribution, ([purchaseCount, customerCount]) => ({
        "Tên": purchaseCount.toString(),
        "Doanh thu": customerCount
    })).sort((a, b) => a["Tên"] - b["Tên"]);

    console.log("Data for chart11:", window.dataPurchaseDistribution);

    // chart12
    const ordersByCustomer1 = d3.rollup(
        data,
        v => d3.sum(v, d => d["Thành tiền"]),
        d => d["Mã khách hàng"]
    );

    const bins = [
        { min: 0, max: 50000, label: "Từ 0 đến 50.000" },
        { min: 50000, max: 100000, label: "Từ 50.000-100.000" },
        { min: 100000, max: 200000, label: "Từ 100.000-200.000" },
        { min: 200000, max: 300000, label: "Từ 200.000-300.000" },
        { min: 300000, max: 400000, label: "Từ 300.000-400.000" },
        { min: 400000, max: 500000, label: "Từ 400.000-500.000" },
        { min: 500000, max: 600000, label: "Từ 500.000-600.000" },
        { min: 600000, max: 700000, label: "Từ 600.000-700.000" },
        { min: 700000, max: 800000, label: "Từ 700.000-800.000" },
        { min: 800000, max: 900000, label: "Từ 800.000-900.000" },
        { min: 900000, max: 1000000, label: "Từ 900.000-1.000.000" },
        { min: 1000000, max: 2000000, label: "Từ 1.000.000-2.000.000" },
        { min: 2000000, max: 3000000, label: "Từ 2.000.000-3.000.000" },
        { min: 3000000, max: 4000000, label: "Từ 3.000.000-4.000.000" },
        { min: 4000000, max: 5000000, label: "Từ 4.000.000-5.000.000" },
        { min: 5000000, max: Infinity, label: "Trên 5.000.000" }
    ];

    const purchaseDistributionBinned = new Map(bins.map(bin => [bin.label, 0]));
    ordersByCustomer1.forEach((amount, customer) => {
        const bin = bins.find(bin => amount >= bin.min && amount < bin.max);
        if (bin) {
            purchaseDistributionBinned.set(bin.label, purchaseDistributionBinned.get(bin.label) + 1);
        }
    });

    window.dataPurchaseDistribution1 = Array.from(purchaseDistributionBinned, ([label, count]) => ({
        "Tên": label,
        "Doanh thu": count
    })).sort((a, b) => {
        const indexA = bins.findIndex(bin => bin.label === a["Tên"]);
        const indexB = bins.findIndex(bin => bin.label === b["Tên"]);
        return indexA - indexB;
    });

    console.log("Data for chart12:", window.dataPurchaseDistribution1);

    // Gọi showChart sau khi tất cả dữ liệu đã được chuẩn bị
    showChart('chart1');
}).catch(error => {
    console.error("Lỗi khi tải dữ liệu:", error);
});

// Hàm drawLineChart để vẽ biểu đồ đường
function drawLineChart(containerId, data, options = {}) {
    const defaultOptions = {
        width: 1000,
        height: 500,
        margin: { top: 40, right: 250, bottom: 50, left: 100 },
        colorScheme: d3.schemeTableau10,
    };
    const config = { ...defaultOptions, ...options };
    const { width, height, margin, colorScheme } = config;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    d3.select(`#${containerId}`).select("svg").remove();

    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const categories = Object.keys(data[0]).filter(key => key !== "Tháng");
    console.log("Categories:", categories);

    const x = d3.scalePoint()
        .domain(data.map(d => d["Tháng"]))
        .range([0, chartWidth]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d3.max(categories, c => d[c] || 0)) * 1.1])
        .nice()
        .range([chartHeight, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(categories)
        .range(colorScheme);

    categories.forEach((category, i) => {
        const safeCategory = category.replace(/[\[\]\s]/g, '_');
        const lineGenerator = d3.line()
            .x(d => x(d["Tháng"]))
            .y(d => y(d[category] || 0))
            .defined(d => d[category] !== undefined && d[category] !== null);

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", colorScale(category))
            .attr("stroke-width", 2)
            .attr("d", lineGenerator);

        svg.selectAll(`.dot-${safeCategory}`)
            .data(data.filter(d => d[category] !== undefined && d[category] !== null))
            .enter().append("circle")
            .attr("class", `dot-${safeCategory}`)
            .attr("cx", d => x(d["Tháng"]))
            .attr("cy", d => y(d[category] || 0))
            .attr("r", 4)
            .attr("fill", colorScale(category));
    });

    svg.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d => `${(d * 100).toFixed(0)}%`));

    const legend = svg.append("g")
        .attr("transform", `translate(${chartWidth + 20}, 0)`);

    categories.forEach((category, i) => {
        const safeCategory = category.replace(/[\[\]\s]/g, '_');
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        legendRow.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colorScale(category));

        legendRow.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(category.replace(/^\[.*?\]\s/, ''))
            .attr("font-size", "12px");
    });

    let tooltip = d3.select("#tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("id", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("padding", "8px")
            .style("visibility", "hidden")
            .style("font-size", "14px")
            .style("z-index", "9999");
    }

    categories.forEach((category) => {
        const safeCategory = category.replace(/[\[\]\s]/g, '_');
        svg.selectAll(`.dot-${safeCategory}`)
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                    .html(`
                        <strong>${category.replace(/^\[.*?\]\s/, '')}</strong><br>
                        Tháng ${d["Tháng"].replace("Tháng ", "")}: ${((d[category] || 0) * 100).toFixed(1)}%
                    `);
            })
            .on("mousemove", (event) => {
                tooltip.style("top", (event.pageY - 10) + "px")
                       .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });
    });
}

// Hàm showChart để hiển thị chart tương ứng
function showChart(chartId) {
    d3.select("#chart-container").selectAll("*").remove();

    let title;
    switch(chartId) {
        case 'chart1': title = 'Doanh số bán hàng theo Mặt hàng'; break;
        case 'chart2': title = 'Doanh số bán hàng theo Nhóm hàng'; break;
        case 'chart3': title = 'Doanh số bán hàng theo Tháng'; break;
        case 'chart4': title = 'Doanh số trung bình theo Ngày trong tuần'; break;
        case 'chart5': title = 'Doanh số trung bình theo Ngày trong Tháng'; break;
        case 'chart6': title = 'Doanh số bán hàng trung bình theo khung giờ'; break;
        case 'chart7': title = 'Xác suất bán hàng theo Nhóm hàng'; break;
        case 'chart8': title = 'Xác suất bán hàng theo Nhóm hàng theo Tháng'; break;
        case 'chart9': title = 'Xác suất bán hàng của Mặt hàng theo Nhóm hàng'; break;
        case 'chart10': title = 'Xác suất bán hàng của Mặt hàng theo Nhóm hàng theo Tháng'; break;
        case 'chart11': title = 'Phân phối Lượt mua hàng'; break;
        case 'chart12': title = 'Phân phối Mức chi trả của Khách'; break;
        default: title = `Doanh thu theo nhóm hàng (${chartId})`;
    }
    d3.select("#chart-title").text(title);

    let dataToUse, options = { horizontal: true }, chartType = "bar";
    switch(chartId) {
        case 'chart1':
            dataToUse = window.dataMatHang || [];
            options = { horizontal: true };
            break;
        case 'chart2':
            dataToUse = window.dataNhomHang || [];
            options = { horizontal: true };
            break;
        case 'chart3':
            dataToUse = window.dataTheoThang || [];
            options = { horizontal: false, colorScheme: d3.schemePastel1 };
            break;
        case 'chart4':
            dataToUse = window.dataTheoNgayTrongTuan || [];
            options = { horizontal: false, colorScheme: d3.schemePastel1 };
            break;
        case 'chart5':
            dataToUse = window.dataTheoNgayTrongThang || [];
            options = { horizontal: false };
            break;
        case 'chart6':
            dataToUse = window.dataTheoKhungGio || [];
            options = { horizontal: false };
            break;
        case 'chart7':
            dataToUse = window.dataTyLeNhomHang || [];
            options = { horizontal: true };
            break;
        case 'chart8':
            dataToUse = window.dataXacSuatThang || [];
            options = { colorScheme: d3.schemeTableau10 };
            chartType = "line";
            break;
        case 'chart9':
            break;
        case 'chart10':
            break;
        case 'chart11':
            dataToUse = window.dataPurchaseDistribution || [];
            options = { horizontal: false };
            break;
        case 'chart12':
            dataToUse = window.dataPurchaseDistribution1 || [];
            options = { horizontal: false };
            break;
        default:
            dataToUse = window.dataNhomHang || [];
            options = { horizontal: true };
    }

    if (chartId === 'chart9') {
        if (!window.dataXacSuatNhomHangTheoThang || window.dataXacSuatNhomHangTheoThang.length === 0) {
            console.error("Dữ liệu chart9 không hợp lệ:", window.dataXacSuatNhomHangTheoThang);
            return;
        }

        const chartContainer = d3.select("#chart-container")
            .classed("chart9-grid", true)
            .style("display", "grid")
            .style("gap", "20px");

        window.dataXacSuatNhomHangTheoThang.forEach((groupData, index) => {
            const subChartDiv = chartContainer.append("div")
                .attr("id", `chart9-sub-${groupData.group}`)
                .classed("chart9-sub", true)
                .style("width", "100%");

            subChartDiv.append("h3")
                .style("font-size", "16px")
                .style("margin", "10px 0")
                .style("text-align", "center")
                .text(`[${groupData.group}] ${groupData.groupName || 'Không có tên'}`);

            drawBarChart(`chart9-sub-${groupData.group}`, groupData.data, { 
                horizontal: true,
                width: 500,
                height: 400,
                margin: { top: 40, right: 50, bottom: 50, left: 200 }
            });
        });
    } else if (chartId === 'chart10') {
        if (!window.dataXacSuatNhomHangTheoThangss || window.dataXacSuatNhomHangTheoThangss.length === 0) {
            console.error("Dữ liệu chart10 không hợp lệ:", window.dataXacSuatNhomHangTheoThangss);
            return;
        }

        const chartContainer = d3.select("#chart-container")
            .classed("chart10-grid", true)
            .style("display", "grid")
            .style("gap", "20px");

        window.dataXacSuatNhomHangTheoThangss.forEach((groupData, index) => {
            const subChartDiv = chartContainer.append("div")
                .attr("id", `chart10-sub-${groupData.group}`)
                .classed("chart10-sub", true)
                .style("width", "100%");

            subChartDiv.append("h3")
                .style("font-size", "16px")
                .style("margin", "10px 0")
                .style("text-align", "center")
                .text(`[${groupData.group}] ${groupData.groupName || 'Không có tên'}`);

            drawLineChart(`chart10-sub-${groupData.group}`, groupData.data, {
                width: 500,
                height: 400,
                margin: { top: 40, right: 150, bottom: 50, left: 100 },
                colorScheme: d3.schemeTableau10
            });
        });
    } else {
        const chartDiv = d3.select("#chart-container")
            .append("div")
            .attr("id", chartId);

        if (chartType === "line") {
            drawLineChart(chartId, dataToUse, options);
        } else {
            drawBarChart(chartId, dataToUse, options);
        }
    }
}
