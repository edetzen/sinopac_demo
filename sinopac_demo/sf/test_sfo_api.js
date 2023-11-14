function test_sfo_api() {
    const api_url = document.getElementById('api_url').value + '/sfo/section/recommend?org_id=' + document.getElementById('org_id').value + '&access_token=' + document.getElementById('access_token').value

    let headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "project-name": document.getElementById('project_id').value
    }

    let body = {
        "section_id": document.getElementById('section_id').value,
        "distinct_id": document.getElementById('distinct_id').value,
        "log_id": document.getElementById('log_id').value,
        "need_sticky_item": true
    }

    document.getElementById('test_sfo_api_div').innerHTML = '<span>處理中...</span>';

    fetch(api_url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })

        // 顯示 SFO API 回傳的內容和 curl 指令
        .then(json => {
            document.getElementById('test_sfo_api_div').innerHTML = '<samp>' + JSON.stringify(json) + '</samp>';
            document.getElementById('test_sfo_api_curl_div').innerHTML = '<samp>curl -H "Content-Type: application/json" -H "project-name:'
                + headers["project-name"]
                + '" -X POST -d \'{"log_id": "'
                + document.getElementById('org_id').value
                + '","section_id": "'
                + body.section_id
                + '","distinct_id": "'
                + body.distinct_id
                + '","need_sticky_item":true}\' \''
                + api_url
                + '\'</samp>';

        })

        // 例外處理
        .catch(error => {
            document.getElementById('test_sfo_api_div').innerHTML = '<span>SFO API 呼叫錯誤，請確認參數或連線。</span>';
            document.getElementById('test_sfo_api_curl_div').innerHTML = '<samp>curl -H "Content-Type: application/json" -H "project-name:'
                + headers["project-name"]
                + '" -X POST -d \'{"log_id": "'
                + document.getElementById('org_id').value
                + '","section_id": "'
                + body.section_id
                + '","distinct_id": "'
                + body.distinct_id
                + '","need_sticky_item":true}\' \''
                + api_url
                + '\'</samp>';

        });
}