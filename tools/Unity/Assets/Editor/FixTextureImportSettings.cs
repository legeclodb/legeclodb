using System.Collections;
using System.Collections.Generic;
using UnityEditor;
using UnityEditor.VersionControl;
using UnityEngine;

public class FixTextureImportSettings : AssetPostprocessor
{
    // デフォルトの maxTextureSize が 2048 であるために一部のキャラのテクスチャが縮小されてぼやけてしまうので、
    // インポート時に 4096 に変更する

    void OnPreprocessTexture()
    {
        // or EditorUserBuildSettings.overrideMaxTextureSize ?

        var importer = assetImporter as UnityEditor.TextureImporter;
        if (importer)
        {
            importer.maxTextureSize = 4096;
            importer.mipmapEnabled = false;
        }
    }
}
