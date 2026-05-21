import sys
import time
import os
import unittest
import numpy as np
from unittest.mock import MagicMock, patch

# Ensure the cv path is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "ml-models", "cv")))

# Mock dependencies
import cv2
import mediapipe as mp

# Mock MockFaceMeshResults
class MockFaceMeshResults:
    def __init__(self):
        class MockLandmark:
            def __init__(self, x, y, z=0.0, visibility=1.0):
                self.x = x
                self.y = y
                self.z = z
                self.visibility = visibility
        
        # Create a list of 478 mock landmarks
        landmarks = [MockLandmark(0.5, 0.5) for _ in range(478)]
        # Nose landmark
        landmarks[1] = MockLandmark(0.5, 0.5)
        # Eye aspect ratio (horizontal outer/inner, vertical top/bottom)
        # Left eye: LEFT_EYE_HORIZ_OUTER = 33, LEFT_EYE_HORIZ_INNER = 133, LEFT_EYE_VERT_TOP = 159, LEFT_EYE_VERT_BOTTOM = 145
        landmarks[33] = MockLandmark(0.4, 0.5)
        landmarks[133] = MockLandmark(0.6, 0.5)
        landmarks[159] = MockLandmark(0.5, 0.45)
        landmarks[145] = MockLandmark(0.5, 0.55)
        
        # Right eye: RIGHT_EYE_HORIZ_INNER = 362, RIGHT_EYE_HORIZ_OUTER = 263, RIGHT_EYE_VERT_TOP = 386, RIGHT_EYE_VERT_BOTTOM = 374
        landmarks[263] = MockLandmark(0.6, 0.5)
        landmarks[362] = MockLandmark(0.4, 0.5)
        landmarks[386] = MockLandmark(0.5, 0.45)
        landmarks[374] = MockLandmark(0.5, 0.55)
        
        class MockMultiFaceLandmarks:
            def __init__(self, lms):
                self.landmark = lms
                
        self.multi_face_landmarks = [MockMultiFaceLandmarks(landmarks)]

# Mock MockPoseResults
class MockPoseResults:
    def __init__(self):
        class MockLandmark:
            def __init__(self, x, y, z=0.0, visibility=1.0):
                self.x = x
                self.y = y
                self.z = z
                self.visibility = visibility
        
        landmarks = [MockLandmark(0.5, 0.5, visibility=0.9) for _ in range(33)]
        # Left shoulder (11), Right shoulder (12), Nose (0)
        landmarks[11] = MockLandmark(0.4, 0.8, visibility=0.9)
        landmarks[12] = MockLandmark(0.6, 0.8, visibility=0.9)
        landmarks[0] = MockLandmark(0.5, 0.4, visibility=0.9)
        
        class MockPoseLandmarks:
            def __init__(self, lms):
                self.landmark = lms
                
        self.pose_landmarks = MockPoseLandmarks(landmarks)

def run_integration_test(session_id):
    # Set arguments for command line simulation
    sys.argv = [
        "cv_monitor.py",
        "--camera", "0",
        "--stream",
        "--session-id", session_id,
        "--stream-interval", "2",  # Accelerate streaming to 2 seconds for faster verification
        "--backend-url", "http://127.0.0.1:8000"
    ]
    
    # Mocking OpenCV video capture and visual elements
    mock_camera = MagicMock()
    mock_camera.isOpened.return_value = True
    
    # Create a dummy black frame
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    mock_camera.read.return_value = (True, dummy_frame)
    
    # Patch cv2.VideoCapture to return mock camera
    cv2.VideoCapture = MagicMock(return_value=mock_camera)
    
    # Patch visual parts of cv2 to prevent GUI frames
    cv2.imshow = MagicMock()
    cv2.destroyAllWindows = MagicMock()
    
    # Capture start time to exit test after 15 seconds
    start_time = time.time()
    
    def mock_wait_key(delay):
        elapsed = time.time() - start_time
        # We need calibration (8 seconds) + 3 streams (6 seconds) = 14 seconds
        if elapsed > 15.0:
            print("[TEST] 15 seconds elapsed, exiting mock loop gracefully.")
            return ord('q')
        time.sleep(0.05)
        return -1
        
    cv2.waitKey = mock_wait_key
    
    # Mock MediaPipe components
    mock_face_mesh_instance = MagicMock()
    mock_face_mesh_instance.process.return_value = MockFaceMeshResults()
    
    mock_pose_instance = MagicMock()
    mock_pose_instance.process.return_value = MockPoseResults()
    
    mp.solutions.face_mesh.FaceMesh = MagicMock(return_value=mock_face_mesh_instance)
    mp.solutions.pose.Pose = MagicMock(return_value=mock_pose_instance)
    
    # Import cv_monitor and run main
    import cv_monitor
    print("[TEST] Running cv_monitor main loop...")
    cv_monitor.main()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--session-id", required=True)
    args = parser.parse_args()
    
    run_integration_test(args.session_id)
