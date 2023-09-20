using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using UnityEditor;
using UnityEngine;
using static UnityEngine.GraphicsBuffer;

[RequireComponent(typeof(Camera))]
[ExecuteInEditMode]
public class Shot : MonoBehaviour
{
    public static bool IsSpineGameObject(GameObject go, out string name)
    {
        name = "";
        if (go == null)
            return false;
        var m = Regex.Match(go.name, "Spine GameObject \\((.+?)\\)", RegexOptions.RightToLeft);
        if (m.Success)
            name = m.Groups[1].ToString();
        return m.Success;
    }
    public static bool IsSpineGameObject(GameObject go)
    {
        if (go == null)
            return false;
        var m = Regex.Match(go.name, "Spine GameObject \\((.+?)\\)", RegexOptions.RightToLeft);
        return m.Success;
    }
    public static void EachChrObject(System.Action<GameObject, string> callback, bool includeInactive = false)
    {
        string name;
        foreach (var go in FindObjectsOfType<GameObject>(includeInactive))
        {
            if (IsSpineGameObject(go, out name))
            {
                callback(go, name);
            }
        }
    }

    public void FitCameraArea(out GameObject target, out string name, float margin = 1.0f)
    {
        // 撮影対象 Spine GameObject を探す
        target = null;
        name = null;
#if UNITY_EDITOR
        if (IsSpineGameObject(Selection.activeGameObject, out name))
        {
            // 選択された Spine GameObject があればそれを優先
            target = Selection.activeGameObject;
            target.SetActive(true);

            GameObject current = target;
            EachChrObject((go, n) => {
                if (go != current)
                {
                    go.SetActive(false);
                }
            });
        }
        else
#endif
        {
            GameObject r_go = null;
            string r_name = null;
            EachChrObject((go, n) =>
            {
                r_go = go;
                r_name = n;
            });
            target = r_go;
            name = r_name;
        }

        if (target == null)
        {
            Debug.LogError("target Spine GameObject not found");
            return;
        }

        // カメラの範囲を target の bounds に設定
        var cam = GetComponent<Camera>();
        var bounds = target.GetComponent<Renderer>().bounds;
        var center = bounds.center;
        var extents = bounds.extents;
        extents.x += margin;
        extents.y += margin;

        transform.position = new Vector3(center.x, center.y, -10);
        cam.orthographicSize = extents.x / (extents.x / extents.y);
    }

    void DoShot()
    {
        GameObject target;
        string name;
        FitCameraArea(out target, out name);

        var cam = GetComponent<Camera>();
        var bounds = target.GetComponent<Renderer>().bounds;

        // RenderTexture 設定
        int w = (int)(bounds.extents.x * 200.0f);
        int h = (int)(bounds.extents.y * 200.0f);
        var rt = new RenderTexture(w, h, 32);
        cam.targetTexture = rt;

        // Render
        cam.Render();

        // Texture2D に内容をコピーしてエクスポート
        Texture2D dst = new Texture2D(w, h, TextureFormat.RGBA32, false);
        RenderTexture.active = rt;
        dst.ReadPixels(new Rect(0, 0, dst.width, dst.height), 0, 0);
        dst.Apply();

        byte[] bytes = dst.EncodeToPNG();
        string filename = name + ".png";
        File.WriteAllBytes(filename, bytes);
        Debug.Log("export: " + filename);

        cam.targetTexture = null;
        RenderTexture.active = null;
        Object.DestroyImmediate(dst);
        Object.DestroyImmediate(rt);
    }

    void DoShotAll()
    {
        var targets = new List<GameObject>();
        foreach (var go in FindObjectsOfType<GameObject>(true))
        {
            var m = Regex.Match(go.name, "Spine GameObject \\((.+?)\\)", RegexOptions.RightToLeft);
            if (m.Success)
            {
                Debug.Log(go.name);
                targets.Add(go);
            }
        }

        foreach (var go in targets)
        {
            go.SetActive(false);
        }
        foreach (var go in targets)
        {
            go.SetActive(true);
            DoShot();
            go.SetActive(false);
        }
    }


#if UNITY_EDITOR
    [MenuItem("Tools/Shot")]
    static void ShotMenu()
    {
        var shot = Camera.main.GetComponent<Shot>();
        if (shot != null)
        {
            shot.DoShot();
        }
    }

    [MenuItem("Tools/Shot All")]
    static void ShotAllMenu()
    {
        var shot = Camera.main.GetComponent<Shot>();
        if (shot != null)
        {
            shot.DoShotAll();
        }
    }
#endif
}
