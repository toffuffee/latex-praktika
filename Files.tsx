import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "@/redux/store";
import {
  setParent,
  onChangeSorting,
  actions,
  getFiles,
  moveToTrash,
  deleteFiles,
  setRowsPerPage,
  setPageNumber,
} from "@/redux/slices/files";
import { useTable } from "@/components/table";
import { FileHeader } from "@/sections/files/header/FileHeader";
import { FileGridView, FileListView } from "@/sections/files";
import { useLocales } from "@/locales";
import { Box, CircularProgress } from "@mui/material";
import { TablePaginationCustom } from "@/components/table";

// ----------------------------------------------------------------------

export default function Files() {
  const dispatch = useDispatch();
  const { id, folderType } = useParams();
  const prevFolderTypeRef = useRef<string | null | undefined>(null);
  const prevIdRef = useRef<string | null | undefined>(null);

  const {
    isLoading,
    tableData,
    rowsPerPage,
    parentName,
    order,
    orderBy,
    isInitialLoading,
    currentPage,
    search,
    page,
    selected,
    parent,
    pasteEnabled,
    cutMode,
    isLoadingPdf,
    selectedCopyOrCut,
    count
  } = useSelector((state) => state.files);

  const { view } = useSelector((state) => state.mode);

  const { translate } = useLocales();

  const table = useTable({ defaultRowsPerPage: rowsPerPage, selected });

  useEffect(() => {
    const handleParamsChange = async () => {
      if ((prevFolderTypeRef.current && prevFolderTypeRef.current !== folderType)
        || prevIdRef.current !== id) {
        dispatch(setPageNumber(1));

        if (id && folderType !== "s3") {
          dispatch(setParent(id));
        } else if (!id && folderType !== "s3") {
          dispatch(setParent(null));
        }

        dispatch(actions.setSelected([]));

        if (folderType !== "s3" && folderType !== "mail" && folderType !== "setting") {
          try {
            await dispatch(getFiles(folderType || ""));
          } catch (e) {
            console.log(e);
          } finally {
            dispatch(actions.startInitialLoading(false));
          }
        }
      }

      prevFolderTypeRef.current = folderType;
      prevIdRef.current = id;
    };

    handleParamsChange();
  }, [folderType, id, dispatch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (folderType === "s3" || folderType === "mail" || folderType === "setting") return;

        if (prevFolderTypeRef.current === folderType && prevIdRef.current === id) {
          await dispatch(getFiles(folderType || ""));
        }
      } catch (e) {
        console.log(e);
      } finally {
        dispatch(actions.startInitialLoading(false));
      }
    };

    fetchData();
  }, [dispatch, currentPage, rowsPerPage, order, orderBy, parent, search, page]);

  const isNotFound = !isInitialLoading && !isLoading && !tableData.length;

  const handleMoveToTrash = async (selected: string[]) => {
    try {
      await dispatch(moveToTrash({ ids: selected }));

      await dispatch(getFiles(folderType || ""));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteItems = async (selected: string[]) => {
    try {
      await dispatch(deleteFiles(selected));
      await dispatch(getFiles(folderType || ""));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSorting = (orderBy: string) => {
    try {
      dispatch(onChangeSorting(orderBy));
    } catch (error) {
      console.error(error);
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    dispatch(setPageNumber(newPage + 1));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setRowsPerPage(parseInt(event.target.value, 10)));
  };

  const showPagination = folderType !== "list-recent";

  return (
    <>
      <Helmet>
        <title>{`${translate("files")}`}</title>
      </Helmet>

      <FileHeader
        parentName={parentName}
        table={table}
        order={order}
        orderBy={orderBy}
        onChangeSorting={handleSorting}
        handleMoveToTrash={handleMoveToTrash}
        handleDeleteItems={handleDeleteItems}
        parent={parent}
        pasteEnabled={pasteEnabled}
        cutMode={cutMode}
        view={view}
        selectedCopyOrCut={selectedCopyOrCut}
      />

      {isLoadingPdf && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <>
        {view === "list" ? (
          <FileListView
            table={table}
            tableData={tableData}
            handleMoveToTrash={handleMoveToTrash}
            handleDeleteItems={handleDeleteItems}
            isNotFound={isNotFound}
            selected={selected}
            parent={parent}
            pasteEnabled={pasteEnabled}
            cutMode={cutMode}
          />
        ) : (
          <FileGridView
            table={table}
            tableData={tableData}
            isNotFound={isNotFound}
            selected={selected}
            parent={parent}
            pasteEnabled={pasteEnabled}
            cutMode={cutMode}
            handleMoveToTrash={handleMoveToTrash}
            handleDeleteItems={handleDeleteItems}
          />
        )}

        {showPagination && (
          <Box sx={{ position: 'relative', mb: 2 }}>
            <TablePaginationCustom
              count={count}
              page={page - 1}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </Box>
        )}
      </>
    </>
  );
}
