let map;
let center;
let customOverlay;
let geocoder;
let markers = [];
let infoWindow;
let detailAddr;
let itemListEle;
let currPage;

$('#findCurrentLocation').on('click', function () { // 현재 위치로 이동하게 하는 이벤트 리스너
    getCurrentLocation();
});

function initMap() {
    // const container = document.getElementById('map');
    // const options = {
    //     center: new kakao.maps.LatLng(33.450701, 126.570667),
    //     level: 3
    // };
    //
    // const map = new kakao.maps.Map(container, options);

    getCurrentLocation(); // 현재 위치를 받아서 표시한 후 db에 저장된 좌표들을 지도에 표시
    if (geocoder == null)
        geocoder = new kakao.maps.services.Geocoder();
}

// 현재 위치의 정보를 가져온다
function getCurrentLocation() {
    if (navigator.geolocation) { // geolocation을 사용할 수 있다면
        navigator.geolocation.getCurrentPosition(function (position) {
            center = new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude);

            if (map == null)
                map = new kakao.maps.Map($('#map')[0], { center : center });

            const currHtml = '<svg style="width:40px; height: 30px;">' +
                '<circle r="10" fill="#0000FF" stroke="#ffffff" stroke-width="3" cx="20" cy="15"' +
                ' style="filter: drop-shadow(0 0 .3rem dimgray)"></circle></svg>';

            customOverlay = new kakao.maps.CustomOverlay({
                map: map,
                content: currHtml,
                position: center,
                zIndex: 100
            });
            getData(1);
        }, geolocationFailCallBack);
    } else {
        alert('현재 위치를 받아올 수 없음.');
    }
}

function geolocationFailCallBack(error) {
    // switch (error.code) {
    //     case 1 :
    //         alert("geolocation failed. PERMISSION DENIED");
    //         break;
    //     case 2 :
    //         alert("geolocation failed. POSITION_UNAVAILABLE");
    //         break;
    //     case 3 :
    //         alert("geolocation failed. TIMEOUT");
    //         break;
    // }
    alert("geolocation failed. error code :" + error.code);
}

function getData(pageNum) {
    $.ajax({
        method: 'GET',
        url: '/map/getMarkers?page=' + pageNum,
        dataType: "json",
        success: function (result) {
            if (result.data.length > 0) {
                $('#menu_wrap').show();
                currPage = pageNum;
                displayPlaces(result.data);
                displayPagination(result.totalPages);
            } else {
                $('#menu_wrap').hide();
                alert("아직 추가한 장소가 없습니다.");
            }
        }
    });
}

function displayPlaces(favList) { // 마커 mouseover, mouseout 리스너는 여기서 등록
    const placeListEle = $('#placeList')[0];
    let menuWrapEle = $('#menu_wrap');
    let bounds = new kakao.maps.LatLngBounds();
    infoWindow = new kakao.maps.InfoWindow({
        zIndex: 200
    });

    removeAllChildNods(placeListEle);
    removeMarker();

    for (let i = 0; i < favList.length; i++) {
        const latitude = favList[i].latitude;
        const longitude = favList[i].longitude;
        const position = new kakao.maps.LatLng(latitude, longitude); // 위치
        let marker = addMarkers(position, i); // 마커 생성

        searchDetailAddrFromCoords(marker, favList[i], placeListEle);

        bounds.extend(position);
    }
    menuWrapEle.scrollTop();
    map.setBounds(bounds);
}

function displayPagination(totalPages) {
    const paginationEle = $('#placePagination')[0];

    removeAllChildNods(paginationEle);

    for(let i = 0; i < totalPages; i++) {
        const ele = document.createElement('button');
        ele.innerHTML = i+1;
        ele.className = 'page-btn';

        ele.onclick = function () {
            infoWindow.close();
            if (currPage === parseInt(ele.innerHTML)+1) {
                ele.classList.add('on');
            }
            currPage = parseInt(ele.innerHTML);
            getData(ele.innerHTML);
        };

        if (parseInt(currPage) === i+1) {
            ele.classList.add('on');
        }
        paginationEle.append(ele);
    }
}

function addMarkers(position) { // 마커를 맵에 생성하고 리턴
    // 마커 위치 지정
    let marker = new kakao.maps.Marker({
        position: position,
        zIndex: 100
    });
    marker.setMap(map);
    markers.push(marker);

    return marker;
}

function addListItem(placeName) { // map 리스트 각 요소를 만들 함수
    let el = $('<li>', {});
    let placeNameStr = '<div><span class="fav-info-title">' + placeName + '</span></div>';
    el.append(placeNameStr);
    el.append(detailAddr);
    el[0].className = 'item';

    return el;
}

function searchDetailAddrFromCoords(marker, favObj, placeListEle) {
    geocoder.coord2Address(favObj.longitude, favObj.latitude, function (result, status) {
        if (status === kakao.maps.services.Status.OK) {
            detailAddr = !!result[0].road_address ? '<div>도로명 | ' + result[0].road_address.address_name + '</div>'
                : '';
            if (result[0].address.address_name) {
                detailAddr += '<div class="jibun-div">지번     | ' + result[0].address.address_name + '</div>';
            }
            itemListEle = addListItem(favObj.placeName);
            placeListEle.append(itemListEle[0]);

            (function (marker, placeName, detailAddr) {
                displayInfoWindow(marker, placeName, detailAddr);
                kakao.maps.event.addListener(marker, 'mouseover', function () {
                    displayInfoWindow(marker, placeName, detailAddr);
                    infoWindow.open(map, marker);

                    $('#showBbsList').on('click', function () {
                        $.ajax({
                            method: 'GET',
                            url: '/map/bbsList?lat=' + marker.getPosition().getLat() + '&lng=' + marker.getPosition().getLng(),
                            dataType: 'json',
                            success: function (response) {
                                const rs = response.result;
                                if (rs.length === 0) {
                                    alert("해당 위치에 작성된 게시글이 없습니다.");
                                }
                                bbsListModalOpen(rs);
                                console.log(rs);
                            }
                        });
                    });
                });

                kakao.maps.event.addListener(map, 'click', function () {
                    infoWindow.close();
                });

                itemListEle[0].onclick = function () { // 추가된 리스트 중 아이템 1개를 눌렀을 때
                    map.panTo(marker.getPosition());
                    displayInfoWindow(marker, placeName, detailAddr);
                    infoWindow.open(map, marker);

                    $('#showBbsList').on('click', function () {
                        $.ajax({
                            method: 'GET',
                            url: '/map/bbsList?lat=' + marker.getPosition().getLat() + '&lng=' + marker.getPosition().getLng(),
                            dataType: 'json',
                            success: function (response) {
                                const rs = response.result;
                                bbsListModalOpen(rs);
                                console.log(rs);
                            }
                        });
                    });
                }
            })(marker, favObj.placeName, detailAddr);
        }
    });
}

function displayInfoWindow(marker, placeName, detailAddr) {
    const content = '<div class="bAddr">' +
        '<div class="d-flex justify-content-between align-items-center">' +
        // '<input type="hidden" id="hiddenBbsId" value="' + bbsId + '">' +
        '<span class="fav-info-title">' + placeName + '</span>' +
        '<button id="showBbsList" name="showBbsList" class="btn btn-outline-primary">게시글보기</button>' +
        '</div>' + detailAddr + '</div>';

    infoWindow.setContent(content);
}

// 모든 마커를 삭제
function removeMarker() {
    let length = markers.length;
    for (let i = length - 1; i >= 0; i--) {
        markers[i].setMap(null);
        markers.pop();
    }
}

// 모든 자식 element를 삭제하는 함수
function removeAllChildNods(el) {
    while (el.hasChildNodes()) {
        el.removeChild(el.lastChild);
    }
}

// 위치에 해당하는 게시글 리스트를 보여줄 modal 리스너
function bbsListModalOpen(bbsList) {
    const bbsListDiv = $('#bbsList');
    const dialog = $('#bbsListDialog');
    for (let i = 0; i < bbsList.length; i++) {
        let el = $('<li>', {});
        el.addClass("mx-3 my-3 px-2 py-2 bbs-list-li");
        el.attr('id', 'bbsItem_'+i);
        const contents = '<div class="d-flex flex-row justify-content-between align-items-center">' +
            '<input id="bbs-item-id" type="hidden" value="' + bbsList[i].id + '">' +
            '<span class="bbs-title mb-3">' +
            bbsList[i].bbsTitle +
            '</span>'
            + '<span class="mb-3">' +
            bbsList[i].bbsDate +
            '</span> '
            + '</div>';
        el.append(contents);
        bbsListDiv[0].append(el[0]);
    }

    $(document).on('click', 'li.mx-3.my-3.px-2.py-2.bbs-list-li', function () {
        const bbsId = this.firstChild.firstChild.defaultValue;
        location.href = '/post/bbs/view?id=' + bbsId;
    });

    dialog.modal('show');
}

function bbsListModalClose() {
    $('#bbsListDialog').modal('hide');
    $('#bbsListDialog').on('hide.bs.modal', function () {
        const bbsListDiv = $('#bbsList')[0];
        removeAllChildNods(bbsListDiv);
    });
}