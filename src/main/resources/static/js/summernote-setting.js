const setting = { // summernote 설정
    height: 200,                 // 에디터 높이
    lang: "ko-KR",					// 한글 설정
    placeholder: '내용을 입력해주세요',	//placeholder 설정
    disableGrammar: true,
    toolbar: [
        ['fontname', ['fontname']],
        ['fontsize', ['fontsize']],
        ['style', ['bold', 'italic', 'underline','strikethrough', 'clear']],
        ['color', ['forecolor','color']],
        ['table', ['table']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['height', ['height']],
        ['insert',['picture','link']],
        ['view', ['fullscreen', 'help']],
        ['lineHeights', ['lineHeights']]
    ],
    fontNames: ['Arial', 'Arial Black', 'Comic Sans MS', 'Courier New','맑은 고딕','궁서','굴림체','굴림','돋움체','바탕체'],
    lineHeights: ['0.2', '0.3', '0.4', '0.5', '0.6', '0.8', '1.0', '1.2', '1.4', '1.5', '2.0', '3.0'],
    callbacks: {
        onImageUpload: function (files) { // override image upload handler(default: base64 dataURL on IMG tag)
            for(let i = files.length - 1; i >= 0; i--) {
                uploadSummernoteImage(files[i]);
            }
        },
        onMediaDelete: function (target) { // delete media handler
            const startIndex = target[0].src.indexOf('/summernoteImg/');
            let imageUrl = target[0].src.substring(startIndex, target[0].src.length);
            deleteImageFile(imageUrl);
        },
        onPaste: function (e) { // 복붙 핸들러
            let clipboardData = e.originalEvent.clipboardData;
            if (clipboardData && clipboardData.items
                && clipboardData.items.length) {
                let item = clipboardData.items[0];
                if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
                    e.preventDefault();
                }
            }
        }
    }};

function uploadSummernoteImage(file) { // 서버에 이미지 업로드
    const data = new FormData();
    data.append('file', file);

    $.ajax({
        type: 'POST',
        data: data,
        enctype: 'multipart/form-data',
        url: '/api/summernote/uploadImg',
        contentType: false,
        processData: false,
        success: function (data) {
            $('#writeSpace').summernote('insertImage', data.url);
        }
    });
}

function deleteImageFile(src) { // 이미지 삭제 함수
    let obj = [];
    obj.push(src);
    $.ajax({
        type: 'POST',
        data: JSON.stringify({'src': obj}),
        url: '/summernote/deleteImg',
        contentType: 'application/json;charset=utf-8;',
        dataType: 'text',
        success: function (response) {
            console.log(response);
        }
    });
}