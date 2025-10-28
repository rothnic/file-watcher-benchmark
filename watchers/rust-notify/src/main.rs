use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher, Event};
use serde::{Serialize};
use std::env;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize)]
struct WatchEvent {
    #[serde(rename = "type")]
    event_type: String,
    path: String,
    timestamp: u128,
}

#[derive(Serialize)]
struct ErrorEvent {
    #[serde(rename = "type")]
    event_type: String,
    message: String,
    timestamp: u128,
}

fn get_timestamp() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis()
}

fn main() {
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 2 {
        eprintln!("Usage: rust-notify <path>");
        std::process::exit(1);
    }

    let path = Path::new(&args[1]);

    let (tx, rx) = std::sync::mpsc::channel();

    let mut watcher = RecommendedWatcher::new(
        move |res: Result<Event, notify::Error>| {
            tx.send(res).unwrap();
        },
        Config::default(),
    ).expect("Failed to create watcher");

    watcher
        .watch(path, RecursiveMode::Recursive)
        .expect("Failed to watch path");

    // Print ready signal
    let ready = serde_json::json!({
        "type": "ready",
        "timestamp": get_timestamp()
    });
    println!("{}", serde_json::to_string(&ready).unwrap());

    // Process events
    for res in rx {
        match res {
            Ok(event) => {
                for path in event.paths {
                    let watch_event = WatchEvent {
                        event_type: format!("{:?}", event.kind),
                        path: path.display().to_string(),
                        timestamp: get_timestamp(),
                    };
                    if let Ok(json) = serde_json::to_string(&watch_event) {
                        println!("{}", json);
                    }
                }
            }
            Err(e) => {
                let error_event = ErrorEvent {
                    event_type: "error".to_string(),
                    message: e.to_string(),
                    timestamp: get_timestamp(),
                };
                if let Ok(json) = serde_json::to_string(&error_event) {
                    println!("{}", json);
                }
            }
        }
    }
}
