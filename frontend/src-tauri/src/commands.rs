use std::net::UdpSocket;

#[tauri::command]
pub fn get_local_ip() -> Result<String, String> {
    let socket = UdpSocket::bind("0.0.0.0:0").map_err(|e| e.to_string())?;

    socket
        .connect("8.8.8.8:80")
        .map_err(|e| e.to_string())?;

    let local_addr = socket.local_addr().map_err(|e| e.to_string())?;

    Ok(format!("{}:8000", local_addr.ip()))
}