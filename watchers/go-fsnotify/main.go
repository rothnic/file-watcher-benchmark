package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/fsnotify/fsnotify"
)

// Event represents a file system event
type Event struct {
	Type      string `json:"type"`
	Path      string `json:"path"`
	Timestamp int64  `json:"timestamp"`
}

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: go-fsnotify <path>")
	}

	path := os.Args[1]

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Fatal(err)
	}
	defer watcher.Close()

	// Walk the directory tree and add all directories
	err = filepath.Walk(path, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return watcher.Add(path)
		}
		return nil
	})
	if err != nil {
		log.Fatal(err)
	}

	// Print ready signal
	fmt.Println(`{"type":"ready","timestamp":` + fmt.Sprintf("%d", time.Now().UnixMilli()) + `}`)

	// Watch for events
	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}
			e := Event{
				Type:      event.Op.String(),
				Path:      event.Name,
				Timestamp: time.Now().UnixMilli(),
			}
			data, _ := json.Marshal(e)
			fmt.Println(string(data))

		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			errData := map[string]interface{}{
				"type":      "error",
				"message":   err.Error(),
				"timestamp": time.Now().UnixMilli(),
			}
			data, _ := json.Marshal(errData)
			fmt.Println(string(data))
		}
	}
}
