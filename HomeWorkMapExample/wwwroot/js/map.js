const raster = new ol.layer.Tile({
    source: new ol.source.OSM(),
    projection: 'EPSG:3857'
});

//const raster = new ol.layer.Tile({
//    source: new ol.source.XYZ({
//        url: 'http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}'
//    }),
//});

const source = new ol.source.Vector();
const vector = new ol.layer.Vector({
    source: source,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new ol.style.Stroke({
            color: '#23D724',
            width: 4,
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#ff0000',
            }),
        }),
    }),
});

var map = new ol.Map({
    target: 'map',
    layers: [raster, vector],
    view: new ol.View({
        projection: 'EPSG:3857',
        center: ol.proj.fromLonLat([35.243322, 38.963745]),
        zoom: 6
    })
});

const modify = new ol.interaction.Modify({ source: source });
map.addInteraction(modify);

let draw, snap; // global so we can remove them later

drawPoint = new ol.interaction.Draw({
    source: source,
    type: 'Point',
});

drawLineString = new ol.interaction.Draw({
    source: source,
    type: 'LineString',
});

drawPolygon = new ol.interaction.Draw({
    source: source,
    type: 'Polygon',
});

drawPoint.on('drawend', function (f) {
    getPage(f);
});

drawLineString.on('drawend', function (f) {
    getPage(f);
});

drawPolygon.on('drawend', function (f) {
    getPage(f);
});

map.addInteraction(drawPoint);
map.addInteraction(drawLineString);
map.addInteraction(drawPolygon);

drawPoint.setActive(false);
drawLineString.setActive(false);
drawPolygon.setActive(false);

function addInteractions(drawType) {
    if (drawType == 'Point') {
        drawPoint.setActive(true);
        drawLineString.setActive(false);
        drawPolygon.setActive(false);
    } else if (drawType == 'LineString') {
        drawPoint.setActive(false);
        drawLineString.setActive(true);
        drawPolygon.setActive(false);
    } else if (drawType == 'Polygon') {
        drawPoint.setActive(false);
        drawLineString.setActive(false);
        drawPolygon.setActive(true);
    }
}

function getPage(f) {
    $.get("/Partial/NewEntry", function (data) {
        var format = new ol.format.WKT();
        var wkt = format.writeGeometry(f.feature.getGeometry());
        $.jsPanel({
            position: { my: "center", at: "center", offsetY: 15 },
            theme: "dark",
            contentSize: { width: () => { return Math.min(500, window.innerWidth * 0.9); }, height: () => { return Math.min(400, window.innerHeight * 0.6); }},
            headerTitle: "Çizimi Kaydet",
            content: data,
            onclosed: function (panel) {
                source.removeFeature(f.feature);
            },
            callback: function () {
                var _self = this;
                $('#InputWkt', _self).val(wkt);
                $('#datepicker', _self).datepicker({
                    clearBtn: true,
                    format: "dd/mm/yyyy",
                    language: "tr"
                });
                $("#addBtn", _self).click(function () {
                    var name = $('#InputName', _self).val();
                    var createDate = $('#datepicker', _self).val();
                    var coordinate = $('#InputWkt', _self).val();
                    if (name == "") { $('#alertInputName', _self).css('display', 'block'); return false; } else { $('#alertInputName', _self).css('display', 'none'); }
                    if (createDate == "") { $('#alertdatepicker', _self).css('display', 'block'); return false; } else { $('#alertdatepicker', _self).css('display', 'none'); }
                    $.ajax({
                        url: '/Home/SaveCoordinate/',
                        type: 'POST',
                        dataType: 'json',
                        data: { projectionName: map.getView().getProjection().getCode(), Name: name, CreateDate: createDate, Coordinate: coordinate }
                    });
                    $('#InputName', _self).val('');
                    $('#datepicker', _self).val('');
                    $('#InputWkt', _self).val('');
                    _self.close();
                    Notify('Çizim Kaydedildi.', 'warning');
                });

                $('#cancelBtn').click(function () {
                    _self.close();
                });
                //çizim bittikten sonra hiçbir çizim aracı seçili olmaması için
                drawPoint.setActive(false);
                drawLineString.setActive(false);
                drawPolygon.setActive(false);
                this.content.css("padding", "15px");
            }
        });
    });
}

$('.draw-geom').on('click', function () {
    var _drawType = $(this).prop('name');
    Notify('Çizim aracı ' + _drawType + ' olarak ayarlandı.', 'warning');
    source.clear();
    addInteractions(_drawType);
});

$('.get-info').on('click', function () {
    switch ($(this).prop('name')) {
        case 'display-save-list':
            if ($('#saved-geom').length > 0) {
                jsPanel.activePanels.getPanel("saved-geom").normalize();
            } else {
                $.get("/Home/GetData", function (data) {
                    $.jsPanel({
                        id: 'saved-geom',
                        contentOverflow: { horizontal: 'hidden', vertical: 'scroll' },
                        position: { my: "center", at: "center", offsetY: 15 },
                        theme: "black",
                        contentSize: { width: () => { return Math.min(800, window.innerWidth * 0.9); }, height: () => { return Math.min(500, window.innerHeight * 0.6); }},
                        onwindowresize: true,
                        headerTitle: "Kayıtlı Çizimler",
                        content: '<table id="table"></table>',
                        callback: function (panel) {
                            var _self = this;
                            var $table = $('#table')
                            var $remove = $('#remove')
                            var selections = []
                            source.clear();
                            $table.bootstrapTable({
                                columns: [{
                                    title: 'Id',
                                    field: 'id',
                                    visible: false
                                },
                                {
                                    title: 'Projeksiyon',
                                    field: 'projectionName'
                                }, 
                                {
                                    title: 'Ad',
                                    field: 'name'
                                }, 
                                {
                                    title: 'Tarih',
                                    field: 'createDate'
                                }, 
                                {
                                    title: 'Kordinat',
                                    field: 'coordinate'
                                },
                                {
                                    title: 'İşlemler',
                                    formatter: function (val, row, ind, field) { return '<div style="width:200px;"><button class="btn btn-warning viewType"><i class="bi bi-eye-fill"></i> Göster</button><button style="margin-left:10px;" class="btn btn-info viewInfo"><i class="bi bi-info-circle-fill"></i> Bilgi Al</button></div>' },
                                    events: {
                                        'click .viewType': function (e, value, row, index) {
                                            source.clear();
                                            var format = new ol.format.WKT();
                                            var feature = format.readFeature(row.coordinate);
                                            if (row.projectionName != map.getView().getProjection().getCode()) {
                                                feature.getGeometry().transform(row.projectionName, map.getView().getProjection().getCode());
                                            }
                                            source.addFeature(feature);
                                            modify.setActive(false);
                                            _self.minimize();
                                            var geomType = feature.getGeometry().getType();
                                            var ext = feature.getGeometry().getExtent();
                                            map.getView().fit(ext, map.getSize());
                                            if (geomType == 'Point') {
                                                map.getView().setZoom(15);
                                            }
                                        },
                                        'click .viewInfo': function (e, value, row, index) {
                                            var formID = 'InfoForm' + index;
                                            if ($('#' + formID).length > 0) {
                                                jsPanel.activePanels.getPanel('InfoForm' + index).normalize();
                                            } else {
                                                $.get("/Partial/InfoData", function (data) {
                                                    $.jsPanel({
                                                        id: formID,
                                                        position: { my: "center", at: "center", offsetY: 15 },
                                                        theme: "black",
                                                        contentSize: {
                                                            width: () => { return Math.min(500, window.innerWidth * 0.9); },
                                                            height: () => { return Math.min(400, window.innerHeight * 0.6); }
                                                        },
                                                        headerTitle: "Düzenleme Ekranı",
                                                        content: data,
                                                        onclosed: function (panel) {
                                                            $.each(vector.getSource().getFeatures(), function (index, value) {
                                                                if (value.getId() == row.id) {
                                                                    source.removeFeature(value);
                                                                }
                                                            });
                                                        },
                                                        callback: function () {
                                                            var innerPanel = this;
                                                            $('#datepickerInfo', this).datepicker({
                                                                clearBtn: true,
                                                                format: "dd/mm/yyyy",
                                                                todayHighlight: true,
                                                                language: "tr"
                                                            });
                                                            $('#InputNameInfo', this).val(row.name);
                                                            $('#datepickerInfo', this).val(row.createDate);
                                                            $('#InputWktInfo', this).val(row.coordinate);
                                                            $("#btnDel", innerPanel).on("click", function () {
                                                                $.get("/Home/DeleteRecord", { id: row.id }, function (data) {
                                                                    $('#table').bootstrapTable('remove', {
                                                                        field: 'id',
                                                                        values: [row.id]
                                                                    });
                                                                    jsPanel.activePanels.getPanel('InfoForm' + index).close();
                                                                    Notify('Kayıt Silindi.', 'error');
                                                                    $.each(vector.getSource().getFeatures(), function (index, value) {
                                                                        if (value.getId() == row.id) {
                                                                            source.removeFeature(value);
                                                                        }
                                                                    });
                                                                });
                                                            });
                                                            $("#btnUpd", innerPanel).on("click", function () {
                                                                $.each(vector.getSource().getFeatures(), function (index, value) {
                                                                    if (value.getId() == row.id) {
                                                                        var format = new ol.format.WKT();
                                                                        var wkt = format.writeGeometry(value.getGeometry());
                                                                        $('#InputWktInfo', innerPanel).val(wkt);
                                                                        source.removeFeature(value);
                                                                    }
                                                                });
                                                                var name = $('#InputNameInfo', innerPanel).val();
                                                                var createDate = $('#datepickerInfo', innerPanel).val();
                                                                var coordinate = $('#InputWktInfo', innerPanel).val();
                                                                $.get("/Home/UpdateRecord", { id: row.id, name: name, createDate: createDate, coordinate: coordinate }, function (data) {
                                                                    $('#table').bootstrapTable('updateRow', {
                                                                        index: index,
                                                                        row: {
                                                                            id: row.id,
                                                                            name: name,
                                                                            createDate: createDate,
                                                                            coordinate: coordinate
                                                                        }
                                                                    })
                                                                    jsPanel.activePanels.getPanel('InfoForm' + index).close();
                                                                    Notify('Kayıt Güncellendi.', 'warning');
                                                                });
                                                            });
                                                            $("#btnGeoUpd", innerPanel).on("click", function () {
                                                                var format = new ol.format.WKT();
                                                                var feature = format.readFeature(row.coordinate);
                                                                feature.setId(row.id);
                                                                source.addFeature(feature);
                                                                modify.setActive(true);
                                                                innerPanel.minimize();
                                                                jsPanel.activePanels.getPanel("saved-geom").minimize();
                                                                var geomType = feature.getGeometry().getType();
                                                                var ext = feature.getGeometry().getExtent();
                                                                map.getView().fit(ext, map.getSize());
                                                                if (geomType == 'Point') {
                                                                    map.getView().setZoom(15);
                                                                }
                                                            });
                                                            this.content.css("padding", "15px");
                                                        }
                                                    });
                                                });
                                            }
                                        }
                                    }
                                }],
                                data: data
                            })
                            this.content.css("padding", "15px");
                        }
                    });
                });
            }
            break;
        default:
    }
});
$.get("/Partial/ProjEntry", function (data) {
    $('#projDefine').on('click', function () {
        if ($('#projDef').length > 0) {
            jsPanel.activePanels.getPanel("projDef").normalize();
        } else {
            $.jsPanel({
                id: "projDef",
                position: { my: "center", at: "center", offsetY: 15 },
                theme: "dark",
                contentSize: { width: () => { return Math.min(500, window.innerWidth * 0.9); }, height: () => { return Math.min(300, window.innerHeight * 0.6); } },
                headerTitle: "Projeksiyon Tanımlama",
                content: data,
                callback: function () {
                    this.content.css("padding", "15px");
                    var innerPanel = this;
                    $('#addProjBtn').on('click', function () {
                        var projSource = $('#projSource').val();
                        var projName = $('#sourceName').val();
                        if (projSource == "") {
                            $('#projSource', innerPanel).after('<span id="alertProjName" style="font-size:80%;margin-top: .25rem; color:red;">Boş geçilemez !!</span>');
                            return false;
                        } else {
                            $('#alertProjName', innerPanel).css('display', 'none');
                        }
                        if (projName == "") {
                            $('#sourceName', innerPanel).after('<span id="alertdatepickerProj" style="font-size:80%;margin-top: .25rem; color:red;">Boş geçilemez !!</span>');
                            return false;
                        } else {
                            $('#alertdatepickerProj', innerPanel).css('display', 'none');
                        }
                        $.ajax({
                            url: '/Home/SaveProjection/',
                            type: 'POST',
                            dataType: 'json',
                            data: { projectionName: projName, projectionSource: projSource }
                        });
                        proj4.defs(projName, projSource);
                        ol.proj.proj4.register(proj4);
                        innerPanel.close();
                        Notify('Projeksiyon eklendi.', 'warning');
                    });
                }
            });
        }
    });
});

$.get("/Partial/DataEntry", function (data) {
    $('#dataEntry').on('click', function () {
        if ($('#dataEntryPanel').length > 0) {
            jsPanel.activePanels.getPanel("dataEntryPanel").normalize();
        } else {
            $.jsPanel({
                id: "dataEntryPanel",
                position: { my: "center", at: "center", offsetY: 15 },
                theme: "dark",
                contentSize: { width: () => { return Math.min(500, window.innerWidth * 0.9); }, height: () => { return Math.min(300, window.innerHeight * 0.6); } },
                headerTitle: "Haritaya Veri Gir",
                content: data,
                callback: function () {
                    var panel = this;
                    $.get("/Home/GetProjection", function (data) {
                        $.each(data, function (index, value) {
                            $('#projSelect').append('<option>' + value.projectionName + '</option>');
                        });
                    });
                    $('#drawBtn').on('click', function () {
                        var wkt = $('#wktEntry').val();
                        var proj = $('#projSelect').val();
                        if (wkt == "") { $('#alertProjection', panel).css('display', 'block');return false;} else {$('#alertProjection', panel).css('display', 'none');}
                        source.clear();
                        var format = new ol.format.WKT();
                        var feature = format.readFeature(wkt);
                        feature.getGeometry().transform(proj, map.getView().getProjection().getCode());
                        source.addFeature(feature);
                        var geomType = feature.getGeometry().getType();
                        var ext = feature.getGeometry().getExtent();
                        map.getView().fit(ext, map.getSize());
                        if (geomType == 'Point') {
                            map.getView().setZoom(15);
                        }
                        modify.setActive(false);
                        panel.close();
                    });

                    this.content.css("padding", "15px");
                }
            });
        }
    });
});
$.get("/Partial/WktEntry", function (data) {
    $('#addWkt').on('click', function () {
        if ($('#fromWkt').length > 0) {
            jsPanel.activePanels.getPanel("fromWkt").normalize();
        } else {
            $.jsPanel({
                id: "fromWkt",
                position: { my: "center", at: "center", offsetY: 15 },
                theme: "dark",
                contentSize: { width: () => { return Math.min(500, window.innerWidth * 0.9); }, height: () => { return Math.min(600, window.innerHeight * 0.6); } },
                headerTitle: "WKT'den Ekle",
                content: data,
                callback: function () {
                    var _self = this;
                    $.get("/Home/GetProjection", function (data) {
                        $.each(data, function (index, value) {
                            $('#projSelectWkt').append('<option>' + value.projectionName + '</option>');
                        });
                    });
                    $('#datepicker', _self).datepicker({
                        clearBtn: true,
                        format: "dd/mm/yyyy",
                        language: "tr"
                    });
                    $('#saveBtn').on('click', function () {
                        var projectionName = $('#projSelectWkt', _self).val();
                        var name = $('#InputName', _self).val();
                        var createDate = $('#datepicker', _self).val();
                        var coordinate = $('#InputWkt', _self).val();
                        if (name == "") { $('#alertAddWkt', _self).css('display', 'block'); return false; } else { $('#alertAddWkt', _self).css('display', 'none'); }
                        if (createDate == "") { $('#alertDataWkt', _self).css('display', 'block'); return false; } else { $('#alertDataWkt', _self).css('display', 'none'); }
                        if (coordinate == "") { $('#alertCoordinateWkt', _self).css('display', 'block'); return false; } else { $('#alertCoordinateWkt', _self).css('display', 'none'); }
                        $('#datepicker', _self).datepicker({
                            clearBtn: true,
                            format: "dd/mm/yyyy",
                            language: "tr"
                        });
                        $.ajax({
                            url: '/Home/SaveCoordinate/',
                            type: 'POST',
                            dataType: 'json',
                            data: { projectionName: projectionName, name: name, createDate: createDate, coordinate: coordinate }
                        });
                        _self.close();
                        Notify('Çizim Kaydedildi.', 'warning');
                    });
                    this.content.css("padding", "15px");
                }
            });
        }
    });
});

Notify('Çizim Aracı Aktif Değil', 'warning');

function Notify(message, levelMessage) {
    runNotify({
        message: message,
        levelMessage: levelMessage,
        timer: 5000
    });
}

$(window).resize(function () {
    var windowHeight = $(window).height();
    $('#map').css('height', windowHeight - 56);
    map.updateSize();
});

$(".tile-layer").on("click", function () {
    var layer = $(this).prop('name');
    raster.getSource().setUrl(layer);
});

$.get("/Home/GetProjection", function (data) {
    $.each(data, function (index, value) {
        proj4.defs(value.projectionName, value.projectionSource);
        ol.proj.proj4.register(proj4);
    });
});

$('#mapClear').on('click', function () {
    source.clear();
});

//const dropzone = document.getElementById('map');

//dropzone.ondragover = function () {
//    return false;
//};
//dropzone.ondragend = function () {
//    return false;
//};
//dropzone.ondragleave = function () {
//    return false;
//};
//dropzone.ondrop = function (e) {
//    e.stopPropagation();
//    e.preventDefault();
//    file = e.dataTransfer.files[0];
//    reader = new FileReader();
//    reader.onload = function (event) {
//        formatKML = new ol.format.KML({
//            extractStyles: true
//        });
//        dataKML = event.target.result;
//        features = formatKML.readFeatures(dataKML, {
//            dataProjection: 'EPSG:4326',
//            featureProjection: 'EPSG:3857'
//        });
//        source.addFeatures(features);
//        extent = source.getExtent();
//        map.getView().fit(extent, map.getSize());
//    }
//    reader.readAsText(file);
//    Notify('KML dosyası eklendi.', 'warning');
//    modify.setActive(false);
//    return false;
//};
let dragAndDropInteraction;
function setInteraction() {
    if (dragAndDropInteraction) {
        map.removeInteraction(dragAndDropInteraction);
    }
    dragAndDropInteraction = new ol.interaction.DragAndDrop({
        formatConstructors: [
            ol.format.KML
        ]
    });
    dragAndDropInteraction.on('addfeatures', function (event) {
        const vectorSource = new ol.source.Vector({
            features: event.features,
        });
        map.addLayer(
            new ol.layer.Vector({
                source: vectorSource,
            })
        );
        map.getView().fit(vectorSource.getExtent());
    });
    map.addInteraction(dragAndDropInteraction);
}
setInteraction();

$('#addKML').change(function () {
    file = $(this).prop('files');
    reader = new FileReader();
    reader.onload = function (event) {
        formatKML = new ol.format.KML({
            extractStyles: true
        });
        dataKML = event.target.result;
        features = formatKML.readFeatures(dataKML, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });
        source.addFeatures(features);
        extent = source.getExtent();
        map.getView().fit(extent, map.getSize());
    }
    reader.readAsText(file[0]);
    Notify('KML dosyası eklendi.', 'warning');
    modify.setActive(false);
});

map.on('singleclick', function (evt) {
    map.forEachFeatureAtPixel(evt.pixel, function (feature) {
        var liste = $.map(feature.getProperties(), function (k, i) {
            if (i !== 'geometry' && i !== 'id') { return { Text: i, Value: k } }
        });
        var htmlCode = "";
        if (feature && liste.length > 0) {
            htmlCode += '<table class="table"><thead><tr><th scope="col">Başlık</th><th scope="col">Değer</th></tr></thead><tbody>';
            $.each(liste, function (i, k) {
                htmlCode += '<tr><th scope="row">' + k.Text + '</th><td>' + k.Value + '</td></tr>';
            });
            htmlCode += '</tbody></table >';
            var popup = new Popup();
            map.addOverlay(popup);
            popup.show(evt.coordinate, htmlCode);
        }
    });

});
var popup = new Popup();
popup.getElement().addEventListener('click', function (e) {
    var action = e.target.getAttribute('data-action');
    if (action) {
        alert('You choose: ' + action);
        if (action === 'yes') {
            popup.hide();
        }
        e.preventDefault();
    }
}, false);

$('#drawAll').on('click', function () {
    source.clear();
    $.get("/Home/GetData", function (data) {
        $.each(data, function (index, value) {
            var format = new ol.format.WKT();
            var feature = format.readFeature(value.coordinate);
            $.each(value, function (i, k) {
                var data = {};
                data[i] = k;
                feature.setProperties(data);
            })
            if (value.projectionName != map.getView().getProjection().getCode()) {
                feature.getGeometry().transform(value.projectionName, map.getView().getProjection().getCode());
            }
            source.addFeature(feature);
        });
    });
    modify.setActive(false);
});

